/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['../../Purchase Order/Mapping/adap_po_field_mapping.js','N/ui/dialog'],

    function (mapper,dialog) {

        const pageInit = () => {
        };

        const sendInvoiceEmail = (intId) => {
            console.log('intId: ' + intId);
            console.log(mapper.objMapping.sendEmailCreatePOSL + intId + '"');
            var options = {
                title: "Invoice",
                message: "Send Invoice to Customer?"
            };

            function confirmSend(result) {
                console.log("Success with value " + result);
                if(result) {
                    window.location.href = mapper.objMapping.sendEmailCreatePOSL + intId;
                }
            }

            function failure(reason) {
                console.log("Failure: " + reason);
            }

            dialog.confirm(options).then(confirmSend).catch(failure);
        }


        return {
            pageInit,
            sendInvoiceEmail,

        };

    });
