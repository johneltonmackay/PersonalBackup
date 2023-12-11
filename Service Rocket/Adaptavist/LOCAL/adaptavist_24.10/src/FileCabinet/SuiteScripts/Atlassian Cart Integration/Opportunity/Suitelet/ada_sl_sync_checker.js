/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['../../Library/NotifAndErrorMessage/adap_notif_error_msg.js'],

    (libNotifHelper) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let objParams = scriptContext.request.parameters;
            log.debug('objParams', objParams)
            let intEstimateId = objParams.estId
            log.debug('intEstimateId', intEstimateId)
            if (intEstimateId) {
                let isSynced = libNotifHelper.validateSyncAndAtlassianConnectionForSL(intEstimateId)
                if (isSynced !== false) {
                    isSynced = true
                }
                scriptContext.response.write({output: JSON.stringify(isSynced)})
            }
        }

        return {onRequest}

    });
