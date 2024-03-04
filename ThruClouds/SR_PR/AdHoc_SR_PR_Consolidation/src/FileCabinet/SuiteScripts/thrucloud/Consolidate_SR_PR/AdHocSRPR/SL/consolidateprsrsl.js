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
            var objForm = ""
            try {
                if (scriptContext.request.method == CONTEXT_METHOD.POST) {
                    let strTransType = scriptContext.request.parameters['custpage_trans_type'];
                    let strFromDate = scriptContext.request.parameters['custpage_from_date'];
                    let strToDate = scriptContext.request.parameters['custpage_to_date'];
                    let intFromLocation = scriptContext.request.parameters['custpage_from_location'];
                    let intToLocation = scriptContext.request.parameters['custpage_to_location'];
                    let intSciptId = scriptContext.request.parameters['custpage_script_id'];
                    let intStatus = scriptContext.request.parameters['custpage_check_status'];
                    let strTranskey = scriptContext.request.parameters['custpage_trans_key'];
                    
                    let objPostParam = {
                        transtype: strTransType,
                        fromdate: strFromDate,
                        todate: strToDate,
                        fromlocation: intFromLocation,
                        tolocation: intToLocation,
                        mrId: intSciptId,
                        mrStatus: intStatus,
                        strTranskey: strTranskey
                    }
                    redirect.toSuitelet({
                        scriptId: slMapping.SUITELET.scriptid,
                        deploymentId: slMapping.SUITELET.deploymentid,
                        parameters: {
                            postData: JSON.stringify(objPostParam)
                        }
                    });
                    
                } else {
                    log.debug('GET scriptContext.request', scriptContext.request.parameters);
                    let scriptObj = scriptContext.request.parameters;

                    if (scriptObj.postData) {
                        let postData = JSON.parse(scriptObj.postData);
                        objForm = slAdhoclibrary.ACTIONS.RunMR({
                            title: slMapping.SUITELET.form.title,
                            postData: postData
                        });  
                    } 

                    else if (scriptObj.transkey) {
                        objForm = slAdhoclibrary.ACTIONS.viewResults({
                            title: slMapping.SUITELET.form.title,
                            transkey: JSON.parse(scriptObj.transkey)
                        });  
                    }
                    
                    else {
                        objForm = slAdhoclibrary.FORM.buildForm({
                            title: slMapping.SUITELET.form.title,
                            dataParam: scriptContext.request.parameters.data
                        });
                    }

                    scriptContext.response.writePage(objForm);
                }

            } catch (err) {
                log.error('ERROR ONREQUEST:', err)
            }

        }

        return { onRequest }

    });
