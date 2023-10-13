/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', '../../Purchase Order/Mapping/adap_po_field_mapping.js', '../Library/adap_mod_handlebars.js', 'N/query', 'N/search', 'N/ui/serverWidget'],

    (record, mapper, modHandleBars, query, search, serverWidget) => {


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
                log.audit('beforeLoad', scriptContext.type)
                if(scriptContext.type == 'view'){
                let objInvoiceRecord = scriptContext.newRecord
                let objForm = scriptContext.form
                let blnEmailSent = objInvoiceRecord.getValue({fieldId: 'custbody_adap_atl_email_sent'})
                log.debug('blnEmailSent',blnEmailSent)
                if (!blnEmailSent) {
                    // let inlineHtmlField = objForm.addField({
                    //     id: 'custpage_inline_email_evnt_listn',
                    //     label: 'Email Event Listener',
                    //     type: serverWidget.FieldType.INLINEHTML,
                    // })
                    // let strEventListenerScript = mapper.objMapping.inlineEventListener
                    // strEventListenerScript = strEventListenerScript.replace('{{intId}}', objInvoiceRecord.id)
                    // inlineHtmlField.defaultValue = strEventListenerScript
                    objForm.clientScriptModulePath = '../../Purchase Order/ClientScript/adap_cs_po_btn_func.js'
                    objForm.addButton({
                        id: 'custpage_send_email_inv',
                        label: 'Send Invoice',
                        functionName: 'sendInvoiceEmail(' + objInvoiceRecord.id + ')'
                    })

                }
                }

            } catch (e) {
                log.error('error', e.message)
            }
        }


        const beforeSubmit = (scriptContext) => {
            log.audit('beforeSubmit', scriptContext.type)
        }

        const afterSubmit = (scriptContext) => {
            log.audit('afterSubmit', scriptContext.type)
        }


        return {beforeLoad, beforeSubmit, afterSubmit}

    });
