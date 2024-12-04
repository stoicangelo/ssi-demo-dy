const acaPyClient = require('../clients/agent/acaPyClient');
const config = require('../utils/env/config');

async function requestProofHandler(req, res) {
    const { connection_id, comment, attrs_to_reveal, attr_restriction_common, attr_restriction_value, condition } = req.body;

    // Validate the request body
    if (!connection_id || !comment || !attrs_to_reveal || !attr_restriction_common || !attr_restriction_value) {
        return res.status(400).json({
            error: 'connection_id, comment, attrs_to_reveal, attr_restriction_common, and attr_restriction_value are required.',
        });
    }

    try {
        // Step 1: Prepare the requested attributes
        const requestedAttributes = {};
        attrs_to_reveal.forEach((attr) => {
            const restrictions = [
                {
                    [attr_restriction_common.type === 'schema' ? 'schema_id' : 'cred_def_id']:
                        attr_restriction_common.value,
                },
            ];

            // Add specific restrictions based on attr_restriction_value array
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

        // Step 2: Prepare the requested predicates
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

        // Step 3: Construct the request body for the admin API
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

        // Step 4: Call the ACA-Py Admin API
        const response = await acaPyClient.post(
            `${config.acapyAdminBase}/present-proof-2.0/send-request`,
            presentationRequestBody,
            { headers: { 'Content-Type': 'application/json' } }
        );
        console.log("presentation request sent!")

        // Step 5: Respond with success
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


// Fetch pending presentations
async function getPresentationDetails(req, res) {
    try {
        // Fetch all presentation exchange records
        const response = await acaPyClient.get(`${config.acapyAdminBase}/present-proof-2.0/records`);

        // Filter records with state 'presentation-received'
        const filteredRecords = response.data.results.filter(
            (record) => record.state === "presentation-received"
        );

        // Map the filtered records to the required format
        const transformedRecords = filteredRecords.map((record) => {
            const byFormat = record.by_format?.pres?.indy || {};
            const revealedAttrs = byFormat.requested_proof?.revealed_attrs || {};
            const unrevealedAttrs = byFormat.requested_proof?.unrevealed_attrs || {};

            // Extract revealed details
            const revealedDetails = Object.entries(revealedAttrs).map(([property, { raw }]) => ({
                property: property.replace("property_", ""),
                value: raw,
            }));

            // Extract unrevealed attributes
            const unrevealedAttrsList = Object.keys(unrevealedAttrs).map((attrName) =>
                attrName.replace("property_", "")
            );
            // Extract conditions not yet verified
            const conditionsNotYetVerified = Object.entries(record.by_format?.pres_request?.indy?.requested_predicates || {}).map(
                ([predicateKey, predicateDetails]) => {
                    const { name, p_type, p_value } = predicateDetails;
                    // Construct condition string if all fields are present
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
        // Call the ACA-Py client to verify the presentation
        const response = await acaPyClient.post(
            `${config.acapyAdminBase}/present-proof-2.0/records/${presExId}/verify-presentation`
        );

        // Extract necessary details from the response
        const byFormat = response.data.by_format?.pres?.indy || {};
        const revealedAttrs = byFormat.requested_proof?.revealed_attrs || {};
        const unrevealedAttrs = byFormat.requested_proof?.unrevealed_attrs || {};
        const predicates = response.data.by_format?.pres_request?.indy?.requested_predicates || {};

        // Extract revealed details
        const revealedDetails = Object.entries(revealedAttrs).map(([property, { raw }]) => ({
            property: property.replace("property_", ""),
            value: raw,
        }));

        // Extract unrevealed attributes
        const unrevealedAttrsList = Object.keys(unrevealedAttrs).map((attrName) =>
            attrName.replace("property_", "")
        );

        // Extract conditions not yet verified
        const conditionsNotYetVerified = Object.entries(predicates).map(([predicateKey, predicateDetails]) => {
            const { name, p_type, p_value } = predicateDetails;
            return name && p_type && typeof p_value !== "undefined"
                ? `${name} ${p_type} ${p_value}`
                : predicateKey;
        });

        // Prepare the response object
        const formattedResponse = {
            verified: response.data.verified === "true",
            updated_at: response.data.updated_at,
            comment: response.data.pres_request?.comment || "",
            revealed_details: revealedDetails,
            unrevealed_attrs: unrevealedAttrsList,
        };

        // Add conditions based on the verification status
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


