/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['../../Library/NotifAndErrorMessage/adap_notif_error_msg.js',
        '../../Library/FieldAndValueMapper/adap_field_and_def_value_mapper.js', '../../Library/SQL/adap_sql_library.js',
        '../../Library/integrator/integrator.js','N/record'],

    (libNotifHelper,libFieldAndDefaultValue,libSQL,integrator,record) => {
        /**
         * Defines the function that is executed when a GET request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const get = (requestParams) => {
            log.debug('test',requestParams)
                let objParams = requestParams;
                log.debug('objParams', objParams)
                let intEstimateId = objParams.estId
                log.debug('intEstimateId', intEstimateId)
            if(objParams.action == 'getRefreshQuote'){
                let objEstimateRecord = record.load({
                    type: record.Type.ESTIMATE,
                    id: objParams.estimate,
                    isDynamic: true
                })
                let responseBody = libNotifHelper.getRefreshQuote({
                    action: 'getRefreshQuote',
                    estimate: objEstimateRecord.id,
                    mac: objEstimateRecord.getValue(libFieldAndDefaultValue.estimateFields.fields.macAccount.id)
                })
                log.debug('responseBody', responseBody)
                return JSON.stringify(responseBody)
            }else {
                if (intEstimateId) {
                    let isSynced = libNotifHelper.validateSyncAndAtlassianConnectionForSL(intEstimateId)
                    if (isSynced !== false) {
                        isSynced = true
                    }
                    return JSON.stringify(isSynced)
                }
            }
        }





        return {get}

    });
