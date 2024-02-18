/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(["N/url", "N/redirect", "../Library/sladhoclibrary.js", "../Library/slmapping.js"],

    (url, redirect, slAdhoclibrary, slMapping) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const CONTEXT_METHOD = {
            GET: "GET",
            POST: "POST"
        };

        const onRequest = (scriptContext) => {
            let strTransType = scriptContext.request.parameters['custpage_trans_type'];
            let strFromDate = scriptContext.request.parameters['custpage_from_date'];
            let strToDate = scriptContext.request.parameters['custpage_to_date'];
            let intFromLocation = scriptContext.request.parameters['custpage_from_location'];
            let intToLocation = scriptContext.request.parameters['custpage_to_location'];
            let objPostParam = {
                transtype: strTransType,
                fromdate: strFromDate,
                todate: strToDate,
                fromlocation: intFromLocation,
                tolocation: intToLocation,
            }
            try {
                if (scriptContext.request.method == CONTEXT_METHOD.POST) {
                    let scriptObj = scriptContext.request.parameters
                    log.debug('POST scriptObj', scriptObj);
                    log.debug('POST objPostParam', objPostParam);
                    redirect.toSuitelet({
                        scriptId: slMapping.SUITELET.scriptid,
                        deploymentId: slMapping.SUITELET.deploymentid,
                        parameters: {
                            postData: JSON.stringify(objPostParam)
                        }
                    });
                    if (scriptObj.submitted ="T"){
                        slAdhoclibrary.ACTIONS.RunMR({
                            options: scriptContext
                        });
                    }
                } else {
                    log.debug('GET scriptContext.request', scriptContext.request.parameters);
                    var objForm = slAdhoclibrary.FORM.buildForm({
                        title: slMapping.SUITELET.form.title,
                        dataParam: scriptContext.request.parameters.data
                    });
                    scriptContext.response.writePage(objForm);
                }

            } catch (err) {
                log.error('ERROR ONREQUEST:', err)
            }

        }

        return { onRequest }

    });
