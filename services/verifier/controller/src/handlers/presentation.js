const acaPyClient = require('../clients/agent/acaPyClient');
const config = require('../utils/env/config');

async function requestProofHandler(req, res) {
    const { connection_id, comment, attrs_to_reveal, attr_restriction_common, attr_restriction_value, condition } = req.body;

    if (!connection_id || !comment || !attrs_to_reveal || !attr_restriction_common || !attr_restriction_value) {
        return res.status(400).json({
            error: 'connection_id, comment, attrs_to_reveal, attr_restriction_common, and attr_restriction_value are required.',
        });
    }

    try {
        const requestedAttributes = {};
        attrs_to_reveal.forEach((attr) => {
            const restrictions = [
                {
                    [attr_restriction_common.type === 'schema' ? 'schema_id' : 'cred_def_id']:
                        attr_restriction_common.value,
                },
            ];

            attr_restriction_value.forEach((restriction) => {
                if (restriction.attr_name === attr) {
                    restrictions[0][`attr::${restriction.attr_name}::value`] = restriction.attr_value;
                }
            });

            requestedAttributes[`property_${attr}`] = {
                name: attr,
                restrictions,
            };
        });

        // Prepare the requested predicates
        const requestedPredicates = {};
        condition.forEach((cond) => {
            requestedPredicates[`prove_${cond.attr_name}_condition`] = {
                name: cond.attr_name,
                p_type: cond.operator,
                p_value: cond.operand,
                restrictions: [
                    {
                        [attr_restriction_common.type === 'schema' ? 'schema_id' : 'cred_def_id']:
                            attr_restriction_common.value,
                    },
                ],
            };
        });

        const presentationRequestBody = {
            auto_remove: true,
            auto_verify: false,
            comment,
            connection_id,
            presentation_request: {
                indy: {
                    name: 'Proof request',
                    nonce: '1',
                    requested_attributes: requestedAttributes,
                    requested_predicates: requestedPredicates,
                    version: '1.0',
                },
            },
            trace: false,
        };
        console.log(`sendig the request for presentation with the following body : ${JSON.stringify(presentationRequestBody)}`)

        const response = await acaPyClient.post(
            `${config.acapyAdminBase}/present-proof-2.0/send-request`,
            presentationRequestBody,
            { headers: { 'Content-Type': 'application/json' } }
        );
        console.log("presentation request sent!")

        res.status(200).json({
            message: 'Proof request sent successfully.',
            presentation_request_response: response.data,
        });
    } catch (error) {
        console.error('Error sending proof request:', error.message);
        res.status(500).json({
            error: 'Failed to send proof request.',
            details: error.message,
        });
    }
}


async function getPresentationDetails(req, res) {
    try {
        const response = await acaPyClient.get(`${config.acapyAdminBase}/present-proof-2.0/records`);

        // Filter records with state 'presentation-received'
        const filteredRecords = response.data.results.filter(
            (record) => record.state === "presentation-received"
        );

        // Map the filtered records
        const transformedRecords = filteredRecords.map((record) => {
            const byFormat = record.by_format?.pres?.indy || {};
            const revealedAttrs = byFormat.requested_proof?.revealed_attrs || {};
            const unrevealedAttrs = byFormat.requested_proof?.unrevealed_attrs || {};

            const revealedDetails = Object.entries(revealedAttrs).map(([property, { raw }]) => ({
                property: property.replace("property_", ""),
                value: raw,
            }));

            const unrevealedAttrsList = Object.keys(unrevealedAttrs).map((attrName) =>
                attrName.replace("property_", "")
            );
            const conditionsNotYetVerified = Object.entries(record.by_format?.pres_request?.indy?.requested_predicates || {}).map(
                ([predicateKey, predicateDetails]) => {
                    const { name, p_type, p_value } = predicateDetails;
                    return name && p_type && typeof p_value !== "undefined"
                        ? `${name} ${p_type} ${p_value}`
                        : predicateKey;
                }
            );

            return {
                updated_at: record.updated_at,
                pres_ex_id: record.pres_ex_id,
                comment: record.pres_request?.comment || "",
                revealed_details: revealedDetails,
                unrevealed_attrs: unrevealedAttrsList,
                conditions_not_yet_verified: conditionsNotYetVerified,
            };
        });

        res.status(200).json(transformedRecords);
    } catch (error) {
        console.error("Error fetching presentation records:", error.message);
        res.status(500).json({ error: "Failed to fetch pending presentations." });
    }
}

const verifyPresentationHandler = async (req, res) => {
    const { presExId } = req.params;

    try {
        const response = await acaPyClient.post(
            `${config.acapyAdminBase}/present-proof-2.0/records/${presExId}/verify-presentation`
        );

        const byFormat = response.data.by_format?.pres?.indy || {};
        const revealedAttrs = byFormat.requested_proof?.revealed_attrs || {};
        const unrevealedAttrs = byFormat.requested_proof?.unrevealed_attrs || {};
        const predicates = response.data.by_format?.pres_request?.indy?.requested_predicates || {};

        const revealedDetails = Object.entries(revealedAttrs).map(([property, { raw }]) => ({
            property: property.replace("property_", ""),
            value: raw,
        }));

        const unrevealedAttrsList = Object.keys(unrevealedAttrs).map((attrName) =>
            attrName.replace("property_", "")
        );

        // Extracting conditions not yet verified
        const conditionsNotYetVerified = Object.entries(predicates).map(([predicateKey, predicateDetails]) => {
            const { name, p_type, p_value } = predicateDetails;
            return name && p_type && typeof p_value !== "undefined"
                ? `${name} ${p_type} ${p_value}`
                : predicateKey;
        });

        const formattedResponse = {
            verified: response.data.verified === "true",
            updated_at: response.data.updated_at,
            comment: response.data.pres_request?.comment || "",
            revealed_details: revealedDetails,
            unrevealed_attrs: unrevealedAttrsList,
        };

        if (response.data.verified === "true") {
            formattedResponse.conditions_verified = Object.keys(predicates);
        } else {
            formattedResponse.conditions_not_yet_verified = conditionsNotYetVerified;
        }

        res.status(200).json(formattedResponse);
    } catch (error) {
        console.error("Error verifying presentation:", error.message);
        res.status(500).json({ error: "Failed to verify the presentation." });
    }
}

module.exports = {
    requestProofHandler, getPresentationDetails, verifyPresentationHandler
};


