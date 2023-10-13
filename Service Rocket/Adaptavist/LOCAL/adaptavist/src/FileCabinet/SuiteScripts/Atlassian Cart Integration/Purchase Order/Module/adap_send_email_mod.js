/**
 * @NApiVersion 2.1
 */
define(['N/email', 'N/record', 'N/render','../../Purchase Order/Mapping/adap_po_field_mapping.js'],

    (email, record, render,mapper) => {

        const sendEmailWithAttachment = (intInvoiceId) => {
            let blnEmailSent = false;
            try {
                if (intInvoiceId) {
                    let objInvoiceRecord = record.load({
                        type: record.Type.INVOICE,
                        id: intInvoiceId,
                        isDynamic: true
                    })
                    var transactionFile = render.transaction({
                        entityId: parseInt(intInvoiceId),
                        printMode: render.PrintMode.PDF,
                        inCustLocale: true
                    });

                    let objMergedEmailTemplate = mergeEmailTemplate(objInvoiceRecord,parseInt(intInvoiceId))
                    email.send({
                        author: objInvoiceRecord.getValue('salesrep'),
                        recipients: objInvoiceRecord.getValue('entity'),
                        subject:objMergedEmailTemplate.subject,
                        body: objMergedEmailTemplate.body,
                        attachments: [transactionFile],
                        relatedRecords: {
                            transactionId: intInvoiceId,
                        }
                    })
                    blnEmailSent = true
                }
            } catch (e) {
                log.error('error sending email', e.message)
            }


            return blnEmailSent
        }

        const mergeEmailTemplate = (objInvoiceRecord,intInvoiceId) => {

            var objMergedEmail = render.mergeEmail({
                templateId:mapper.objMapping.invEmailTemplate ,
                transactionId: intInvoiceId
            });
            log.debug('objMergedEmail', objMergedEmail)
            return objMergedEmail

        }


        return {sendEmailWithAttachment}

    });
