/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/query', 'N/record',
        '../../Purchase Order/Library/adap_mod_handlebars.js', '../../Opportunity/UserEvent/lib/ada_ue_helper.js',
        '../../Library/NotifAndErrorMessage/adap_notif_error_msg.js', '../../Library/FieldAndValueMapper/adap_field_and_def_value_mapper.js',
        '../../Library/SQL/adap_sql_library.js', 'N/ui/serverWidget', 'N/redirect'],

    (query, record,
     modHandleBars, libValidation,
     notifAndErrorMsgHelper, libFieldAndDefaultValue,
     libSQL, serverWidget, redirect) => {


        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            try {
                log.debug('scriptContext.type', scriptContext.type)
                let objRecord = scriptContext.newRecord;
                let objForm = scriptContext.form;
                if (scriptContext.type == 'view' || scriptContext.type == 'create') {
                    log.debug('checkATLConnection')
                    notifAndErrorMsgHelper.checkATLConnection(objForm)
                }


                if (scriptContext.type == 'view') {
                    let requestParams = scriptContext.request.parameters
                    let isSyncedChecker = requestParams.isSynced
                    log.debug('isSyncedChecker', isSyncedChecker)
                    let objDynamicRecord = libValidation.loadDynamicEstimate(objRecord.id);
                    let intForm = objDynamicRecord.getValue({fieldId: 'customform'});
                    // log.debug('MAPPER.customForms.estimate', MAPPER.customForms.estimate)
                    if (intForm == libFieldAndDefaultValue.customForms.estimate) {
                        let objRefreshQuoteButton = objForm.getButton({
                            id: 'custpage_refresh_quote'
                        })
                        if (objRefreshQuoteButton) {
                            objRefreshQuoteButton.isHidden = true
                        }
                        let strMRStatus = objDynamicRecord.getValue('custbody_adap_atl_refresh_status')
                        log.debug('intForm inside', intForm)
                        if (!strMRStatus || strMRStatus.includes('MAPREDUCETASK') === false) {
                            if (isSyncedChecker === 'false') {
                                notifAndErrorMsgHelper.validateSyncAndAtlassianConnection(scriptContext)
                            }
                            log.debug('validateSyncAndAtlassianConnection')
                        } else {
                            if (isSyncedChecker === 'false') {
                                redirect.toRecord({
                                    type: record.Type.ESTIMATE,
                                    id: objRecord.id,
                                    parameters: {isForRefresh: true}
                                })
                            }
                        }
                        libValidation.validateRunningMR(scriptContext)
                        log.debug('validateRunningMR')
                        var hasOpenOrder = libSQL.search({
                            type: 'hasOpenOrder',
                            params: {
                                estid: objRecord.id,
                            }
                        });
                        log.debug('hasOpenOrder', hasOpenOrder)
                        if (hasOpenOrder.length > 0) {
                            let blnValidatedInitialDetails = notifAndErrorMsgHelper.validateTechContactAndGenQuoteBtn(scriptContext)
                            if (blnValidatedInitialDetails) {
                                notifAndErrorMsgHelper.validateGenerateQuotePayload(objRecord, objForm)
                            }
                            // log.debug(' validateTechContactAndGenQuoteBtn')
                            // libValidation.validateEndUserDetail(scriptContext)
                            // log.debug('validateEndUserDetail')
                        }

                        libValidation.updateTechContactHeaderField(objRecord)
                        log.debug('updateTechContactHeaderField')


                        let arrNotLinkedCarts = notifAndErrorMsgHelper.validateCartsIfLinkedToEstimate(objDynamicRecord)
                        log.debug('arrNotLinkedCarts', arrNotLinkedCarts)
                        if (arrNotLinkedCarts.length > 0) {
                            let objMessageDetail = notifAndErrorMsgHelper.objMessages.validateNotifMessage.cartAttachedToMultiple
                            for (let cart of arrNotLinkedCarts) {
                                objMessageDetail.message += '<br>*' + cart
                            }
                            libValidation.hideButtonAndShowMessage(objMessageDetail, scriptContext.form)

                        }
                        let inlineHtmlField = objForm.addField({
                            id: 'custpage_inline_email_evnt_listn',
                            label: 'Email Event Listener',
                            type: serverWidget.FieldType.INLINEHTML,
                        })
                        let strEventListenerScript = libFieldAndDefaultValue.inlineEventListener
                        strEventListenerScript = strEventListenerScript.replace('{{intId}}', objRecord.id)
                        if (isSyncedChecker != 'false' && (!strMRStatus || strMRStatus.includes('MAPREDUCETASK') === false)) {
                            strEventListenerScript += libFieldAndDefaultValue.refreshCheckerScript
                        }
                        inlineHtmlField.defaultValue = strEventListenerScript

                        let inlineHtmlInvoiceField = objForm.addField({
                            id: 'custpage_inline_invoice_evnt_listn',
                            label: 'Invoice Event Listener',
                            type: serverWidget.FieldType.INLINEHTML,
                        })
                        let blnIncludeInReport = objDynamicRecord.getValue({fieldId: 'custbody_adap_atl_include_in_report'});
                        let strInvoiceEventListenerScript = libFieldAndDefaultValue.inlineInvoiceEventListener

                        strInvoiceEventListenerScript = strInvoiceEventListenerScript.replace('{{id}}', objRecord.id)
                        strInvoiceEventListenerScript = strInvoiceEventListenerScript.replace('{{includeInReport}}', blnIncludeInReport)
                        inlineHtmlInvoiceField.defaultValue = strInvoiceEventListenerScript
                        log.debug('strEventListenerScript', strEventListenerScript)

                        libValidation.updateCartItemMaintenancePeriod(objRecord)
                        notifAndErrorMsgHelper.checkExpiredCart(objRecord,objForm)

                    }
                }


            } catch (e) {
                log.error('error Before Load Validation Script', e.message)
            }
        }
        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            log.debug('beforeSubmit')
            //will transfer to after submit since override address is not working in Before submit
            if (scriptContext.type == 'edit' || scriptContext.type == 'create') {
                //libValidation.updateShipAndBillAddress(scriptContext.newRecord, false)
            }
        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            try {
                if (scriptContext.type == 'edit') {
                    let objOldRecord = scriptContext.oldRecord;
                    let objNewRecord = scriptContext.newRecord;
                    // let intForm = objNewRecord.getValue({fieldId:'customform'})
                    // if (intForm == MAPPER.customForms.estimate) {
                    let intOldRecLine = objOldRecord.getLineCount('item')
                    log.debug('intOldRecLine ', intOldRecLine)
                    let intNewRecLine = objNewRecord.getLineCount('item')
                    log.debug('intNewRecLine', intNewRecLine)

                    //let arrOldItems = getLineDetails(objOldRecord, intOldRecLine);
                    let arrNewRecordItems = libValidation.getLineDetails(objNewRecord, intNewRecLine);
                    log.debug('arrNewRecordItems', arrNewRecordItems)
                    // log.debug('arrOldItems', arrOldItems)

                    let strGetEstimateCartSQL = libSQL.sqlQuery.getEstimateCarts
                    let strQueryForEstimateCart = modHandleBars.getResponse({
                        templateContent: strGetEstimateCartSQL,
                        data: {
                            id: objNewRecord.id
                        }
                    });
                    log.debug('strQueryForEstimateCart', strQueryForEstimateCart)
                    let arrEstimateCarts = query.runSuiteQL({
                        query: strQueryForEstimateCart
                    }).asMappedResults();
                    log.debug('arrEstimateCarts', arrEstimateCarts)


                    try {

                        if (arrEstimateCarts.length > 0) {
                            libValidation.UpdateEstimateAtlCartAndItem(arrEstimateCarts, arrNewRecordItems)
                        }


                    } catch (e) {
                        log.error('error Deleting Cart/Cart Item', e.message)
                    }

                }

            } catch (e) {
                log.error('Error Updating Cart and Cart Item', e.message)
            }
        }


        return {beforeLoad, beforeSubmit, afterSubmit}

    });
