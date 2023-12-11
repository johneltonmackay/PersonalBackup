/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/email', 'N/record', 'N/runtime', 'N/search'],
    /**
     * @param{email} email
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     */
    (email, record, runtime, search) => {

        const execute = (scriptContext) => {
            var searchDEId = runtime.getCurrentScript().getParameter("custscript_deactivate_empid");
            var searchACId = runtime.getCurrentScript().getParameter("custscript_activate_empid");
            if (searchDEId){
                let recId = deactivateEmployee(searchDEId)
                log.debug('recId ', recId);
                if (recId.length > 0) {
                    if (searchACId){
                        activateEmployee(searchACId)
                    }
                }
            }
            
        }

        function deactivateEmployee(searchDEId) {
            let intEmpId
            var recId = []
            let actionType = "Deactivate";
            try {
                search.load({
                    id: searchDEId
                }).run().each(function (result) {
                    log.debug(actionType + ' employee id: ', result.id);
                    intEmpId = result.id
                    log.debug('deactivateEmployee intEmpId ', intEmpId);
                    let id = record.submitFields({
                        type: record.Type.EMPLOYEE,
                        id: intEmpId,
                        values: {
                            isinactive: true
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                    recId.push(id)
                    return true;
                });
            } catch (e) {
                sendErrorMsg(intEmpId, actionType, e)
            }
            log.debug('DE record.submitFields id: ', recId);
            return recId;
        }

        function activateEmployee(searchACId) {
            var intEmpId
            var recId = []
            let actionType = "Activate";
            try {
                search.load({
                    id: searchACId
                }).run().each(function (result) {
                    log.debug(actionType + ' employee id: ', result.id);
                    intEmpId = result.id
                    log.debug('activateEmployee intEmpId ', intEmpId);
                    let id = record.submitFields({
                        type: record.Type.EMPLOYEE,
                        id: intEmpId,
                        values: {
                            isinactive: false
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                    recId.push(id)
                    return true;
                });
            } catch (e) {
                sendErrorMsg(intEmpId, actionType, e)
            }
            log.debug('AC record.submitFields id: ', recId);
            return recId;
        }

        function sendErrorMsg(intEmpId, actionType, e) {
            var subject = 'Fatal Error: Unable to ' + actionType + ' Employee Id! '  + intEmpId;
            var authorId = -5;
            var recipientEmail = 'john.mackay@charmedaroma.com';
            email.send({
                author: authorId,
                recipients: recipientEmail,
                subject: subject,
                body: 'Fatal error occurred in script: ' + runtime.getCurrentScript().id + '\n\n' + JSON.stringify(e)
            });
        }

        return {execute}

    });
