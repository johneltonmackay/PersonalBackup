/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/redirect', 'N/query', '../../Opportunity/UserEvent/lib/ada_ue_validations_mapper.js',
        '../../Purchase Order/Library/adap_mod_handlebars.js', '../../Opportunity/UserEvent/lib/ada_ue_helper.js',
        '../../Library/TechnicalContact/adap_lib_tech_contact.js'],

    (record, redirect, query, MAPPER, modHandleBars, libHelper,libTechContact) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            log.debug('Attaching Contact Start')
            let objParams = scriptContext.request.parameters;
            log.debug('objParams', objParams)
            let intEstimateId = objParams.estId
            log.debug('intEstimateId', intEstimateId)
            //unable to get the actual contact id from DOM
            let strContact = objParams.contact
            log.debug('strContact', strContact)

            if (strContact && intEstimateId) {
                let arrContact = strContact.split(':')
                log.debug('arrContact', arrContact)
                //get the tech contact name
                let strContactToSearch = arrContact[arrContact.length - 1]
                strContactToSearch = strContactToSearch.trim()
                log.debug('strContactToSearch', strContactToSearch)
                if (strContactToSearch) {
                    let arrEstimateContacts = libTechContact.getEstimateContacts(intEstimateId)
                    log.debug('arrEstimateContacts', arrEstimateContacts)
                    let strContactName = strContactToSearch;
                    let strEmail = ''
                    for (const item of arrEstimateContacts) {
                        if (item.id === strContactToSearch) {
                            strEmail = item.email
                            break; // Exit the loop once a match is found
                        }
                    }

                    log.debug('strContactName', strContactName)
                    log.debug('strEmail', strEmail)
                    let objEstimateRecord = loadDynamicRecord(record.Type.ESTIMATE, intEstimateId)

                    //record.submitfields not working on the ff fields
                    objEstimateRecord.setValue({
                        fieldId: 'custbody_atl_tech_contact_email',
                        value: strEmail
                    })
                    objEstimateRecord.setValue({
                        fieldId: 'custbody_atl_tech_contact_name',
                        value: strContactName
                    })
                    let intEstSaved = objEstimateRecord.save()
                    log.debug('intEstSaved', intEstSaved)

                }

            }
            redirect.redirect({
                url: MAPPER.estimateLink + intEstimateId
            })

        }

        const loadDynamicRecord = (strRecType, id) => {
            let objRecord = record.load({
                type: strRecType,
                id: id,
                isDynamic: true
            })
            return objRecord
        }

        return {onRequest}

    });
