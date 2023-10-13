/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', '../../Purchase Order/Mapping/adap_po_field_mapping.js',
        '../Library/adap_mod_handlebars.js', 'N/query', 'N/search', 'N/redirect', '../../Purchase Order/Module/adap_send_email_mod.js',
        '../../Purchase Order/Module/adap_create_po_mod.js'],

    (record, mapper, modHandleBars, query, search, redirect,
     sendEmailMod, createPOMod) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            log.debug('creating PO Start')
            let objParams = scriptContext.request.parameters;
            log.debug('objParams', objParams)
            let intInvoiceId = objParams.invoiceId

            if (intInvoiceId) {
                //send email and attach the email record to transaction
                let blnEmailIsSent = sendEmailMod.sendEmailWithAttachment(intInvoiceId)
                log.debug('blnEmailIsSent', blnEmailIsSent)
                // only execute PO if Email was sent
                if (blnEmailIsSent) {
                    // create PO if not existing
                    createPOMod.createPO(intInvoiceId)
                }


                record.submitFields({
                    type:record.Type.INVOICE,
                    id:intInvoiceId,
                    values:{
                        custbody_adap_atl_email_sent:true
                    }
                })

                redirect.toRecord({
                    type: record.Type.INVOICE,
                    id: parseInt(intInvoiceId)
                })
            }
        }


        return {onRequest}

    });
