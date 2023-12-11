/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

var windowHandler;
define(['N/https', 'N/url', 'N/currentRecord', 'N/ui/message', 'N/ui/dialog', 'N/record',
        '../../Library/FieldAndValueMapper/adap_field_and_def_value_mapper.js', '../../Library/saveSearch',
        '../../Library/SQL/adap_sql_library.js', '../../Library/NotifAndErrorMessage/adap_notif_error_msg_for_cs.js'],
    function (https, url, currentRecord, message, dialog, record,
              libMapper, savedSearch, libSuitesQl, libMessages) {
        const pageInit = () => {
        };

        (function jqueryimport() {
            var jQueryScript = document.createElement('script');
            jQueryScript.setAttribute('src', '/core/media/media.nl?id=4723&c=8190294_SB1&h=X2nV87x9JmORtwEApPCZZXZHNSpE6ZwjksupARI7AitWXZjE&_xt=.js');
            document.head.appendChild(jQueryScript);
            localStorage.clear();
            console.log('cleared localStorage');
        })();
        (() => {
            try {
                require(['N/currentRecord', 'N/search'], (currentRecord, search) => {
                    let strUrl = libMapper.script.link + libMapper.script.parent + libMapper.script.deployment

                    var objMessage = {
                        type: message.Type.INFORMATION,
                        duration: 999999
                    }

                    let objEstimate = currentRecord.get()
                    // var objMRStatus = libSuitesQl.search({
                    // 	type: 'getMrStatus',
                    // 	params: {
                    // 		estid: intEstimate || '',
                    // 	}
                    // })[0]

                    // let rec = currentRecord.get();
                    console.log(objEstimate.type, objEstimate.id)
                    if (objEstimate.type == 'estimate' && objEstimate.id) {
                        var objMapReduceMessage = libMessages.objMessages.mapReduceMessage;
                        var objMRStatusSearch = search.lookupFields({
                            type: 'estimate',
                            id: objEstimate.id,
                            columns: ['custbody_adap_atl_refresh_status', 'type', 'custbody_adap_fail_reason']
                        });
                        var objMRStatus = {
                            status: objMRStatusSearch.custbody_adap_atl_refresh_status,
                            type: objMRStatusSearch.type[0].value,
                            failreason: objMRStatusSearch.custbody_adap_fail_reason
                        }

                        console.log('objMRStatus', objMRStatus)

                      if (objMRStatus.status.includes('DONE') || objMRStatus.status.includes('FAILED')) {

                            objMessage = {
                                type: message.Type.CONFIRMATION,
                                duration: 60000
                            }
                            let strFailReason = objMRStatus.failreason
                            console.log('strFailReason', strFailReason)

                          if (objMRStatus.failreason) {
                                //failedRefreshEstimate
                              let strMessage = (objMapReduceMessage.failedGenericEstimate.message + '<br> Error Message: ' + objMRStatus.failreason).replace(/&lt;br&gt;/g,'<br>');
                              objMessage.title = objMapReduceMessage.failedGenericEstimate.title;
                              objMessage.message = strMessage
                              objMessage.type = message.Type.ERROR;
                              // showMessage = message.create(objMessage);
                              // showMessage.show();
                          }else {
                              switch (objMRStatus.status) {
                                  case 'DONE_GENERATE_QUOTE':
                                      objMessage.title = objMapReduceMessage.doneGenericEstimate.title;
                                      objMessage.message = objMapReduceMessage.doneGenericEstimate.message;
                                      break;
                                  case 'FAILED_GENERATE_QUOTE':
                                      objMessage.title = objMapReduceMessage.failedGenericEstimate.title;
                                      objMessage.message = objMapReduceMessage.failedGenericEstimate.message;
                                      break;
                                  case 'DONE_REFRESH_QUOTE':
                                      objMessage.title = objMapReduceMessage.doneGenericEstimate.title;
                                      objMessage.message = objMapReduceMessage.doneGenericEstimate.message;
                                      break;
                                  case 'FAILED_REFRESH_QUOTE':
                                      objMessage.title = objMapReduceMessage.failedGenericEstimate.title;
                                      objMessage.message = objMapReduceMessage.failedGenericEstimate.message;
                                      break;
                              }

                              if (objMRStatus.status.includes('FAILED')) {
                                  objMessage.type = message.Type.ERROR;
                              }
                          }

                            record.submitFields({
                                type: 'estimate',
                                id: objEstimate.id,
                                values: {
                                    [libMapper.estimateFields.fields.refreshQuoteStatus.id]: '',
                                }, options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true,
                                }
                            });

                            var showMessage = message.create(objMessage);
                            showMessage.show();

                        } else if (objMRStatus.status.includes('MAPREDUCETASK')) {
                            objMessage = {...objMessage, ...libMessages.objMessages.mapReduceMessage.genericEstimate};
                            var showMessage = message.create(objMessage);
                            showMessage.show();
                        }
                    }

                    console.log('objMessage', objMessage)

                })
                // var fnMRListener = setInterval(() => {
                // strUrl += '&action=getMrStatus&estid=' + intEstimateId
                // https.get({
                // 	url: strUrl,
                // 	headers: { 'Content-Type': 'application/json' }
                // }).then((response) => {
                // 	console.log('checkMrScript', response)
                // })
                // })
            } catch (e) {
                console.log('ClientScript | ', e)
            }

        })();


        const atlassiancart = (option) => {
            console.log('atlassiancart', option)
            let objCurrentRecord = currentRecord.get()
            let strUrl = libMapper.script.link + libMapper.script.parent + libMapper.script.deployment

            var intCustomerId = objCurrentRecord.getValue('entity');
            var intSalesRepId = objCurrentRecord.getValue('salesrep');
            var intTCid = objCurrentRecord.getValue('custbody_st_termsandconditions');
            var intCurrnecyid = objCurrentRecord.getValue('currency');
            var intCurrnecyCode = objCurrentRecord.getValue('currencysymbol');
            var intMacAccount = objCurrentRecord.getValue('custbody_adap_atl_mac_account');

            console.log('objValue', objValue);

            var hasLastState = {uuid: null}
            if (!option.isNewEstRecord) {
                hasLastState = libSuitesQl.search({
                    type: 'getLastState',
                    params: {
                        estid: option.estid,
                    }
                })[0];
            }

            var objValue = {
                cartEstimate: option.estid || null,
                cartId: option.cartId || null,
                cartUuid: option.uuid || hasLastState.uuid || null,
                macAccount: option.isNewEstRecord ? intMacAccount : option.macAccount,
                isEstRec: option.isEstRecord || false,
                customerId: intCustomerId || null,
                salesRepId: intSalesRepId || null,
                tcid: intTCid || null,
                currencyId: intCurrnecyid || null,
                currencyCode: intCurrnecyCode || null,
            }

            console.log('objValue', objValue)
            strUrl += `&mac=${objValue.macAccount}`

            if (option.isNewEstRecord) {
                if (intCustomerId && intSalesRepId) {
                    objValue.subsidiaryId = objCurrentRecord.getValue('subsidiary')
                    displayAtlassianCart(objValue)
                } else {
                    dialog.alert({
                        title: 'Missing Information',
                        message: 'Please ensure that you provide input in both the customer field and the Estimate owner field.'
                    });
                }
            } else {
                displayAtlassianCart(objValue)
            }

            function displayAtlassianCart(option) {
                var hasAlreadyExistingCart = libSuitesQl.search({
                    type: 'getATLCartByUuid',
                    params: {
                        uuid: option.cartUuid || '',
                    }
                })

                if (!option.cartUuid || libMapper.isEmpty(option.cartUuid) || hasAlreadyExistingCart.length) {

                    https.get.promise({
                        url: strUrl + `&action=createCart&estid=${option.estid}`,
                        headers: {'Content-Type': 'application/json'}
                    }).then((response) => {
                        console.log('newcart response', response)
                        option.cartUuid = response.body ? JSON.parse(response.body).uuid : false
                        strUrl += '&view=atlassianCart'
                        strUrl += `&uuid=${option.cartUuid}&estimate=${option.cartEstimate}&cartId=${option.cartId}&isEstRecord=${option.isEstRec}&custid=${option.customerId}&salesRep=${option.salesRepId}&subsidiary=${option.subsidiaryId}&tc=${objValue.tcid}&currency=${objValue.currencyId}&currencycode=${objValue.currencyCode}`
                        windowHandler = nlExtOpenWindow(strUrl, '', 1300, 800, null, false, 'Atlassian Cart', null);
                    });
                } else {
                    strUrl += '&view=atlassianCart'
                    strUrl += `&uuid=${option.cartUuid}&estimate=${option.cartEstimate}&cartId=${option.cartId}&isEstRecord=${option.isEstRec}&custid=${option.customerId}&salesRep=${option.salesRepId}&subsidiary=${option.subsidiaryId}&tc=${objValue.tcid}&currency=${objValue.currencyId}&currencycode=${objValue.currencyCode}`
                    console.log('strUrl', strUrl)
                    windowHandler = nlExtOpenWindow(strUrl, '', 1300, 800, null, false, 'Atlassian Cart', null);
                }
            }
        };

        const generateQuote = (option) => {

            console.log('generateQuote | options', option)

            let options = {
                title: 'Generate Atlassian Quote',
                message: 'Are you sure you want to generate an Atlassian quote?'
            }

            dialog.confirm(options).then(success).catch(failure)

            let strUrl = libMapper.script.link + libMapper.script.parent + libMapper.script.deployment

            strUrl += `&action=generateQuote&mac=${option.macAccount}`

            function success(result) {
                console.log('Generate Atlassian Quote', result)
                if (result) {
                    jQuery('#tbl_custpage_atlassian_generate_quote').hide()
                    var generatingQuoteMessage = message.create({
                        type: message.Type.INFORMATION,
                        title: 'Generating Quote',
                        message: 'Please wait as the quote generation is currently underway. \nThe page will refresh automatically after the generation process is complete. \nDo not close or manually refresh the page',
                        duration: 6000000
                    })
                    generatingQuoteMessage.show()

                    var objValue = {
                        cartEstimate: option.estid,
                        cartId: option.cartId,
                        cartUuid: option.uuid
                    }
                    strUrl += `&uuid=${objValue.cartUuid}&estimate=${objValue.cartEstimate}&cartId=${objValue.cartId}`
                    https.get.promise({
                        url: strUrl,
                        headers: {'Content-Type': 'application/json'}
                    }).then((response) => {
                        console.log('generatequote', response.body)
                        var objResponse = response ? JSON.parse(response.body || '{}') : false
                        var strMsg = objResponse.msg
                        console.log('objResponse', objResponse)
                        generatingQuoteMessage.hide();
                        if (objResponse.httpcode == 500) {
                            dialog.alert({
                                title: objResponse.title,
                                message: `${strMsg}
								${objResponse.purchaser ? '<br> <br>' + objResponse.purchaser : ''}
								${objResponse.technical ? '<br> <br>' + objResponse.technical : ''} 
								${objResponse.billing ? '<br> <br>' + objResponse.billing : ''}`

                            });
                            jQuery('#tbl_custpage_atlassian_generate_quote').show()
                        } else if (objResponse.title && objResponse.msg) {
                            dialog.alert({
                                title: objResponse.title,
                                message: objResponse.msg
                            });
                            jQuery('#tbl_custpage_atlassian_generate_quote').show()
                        } else if (objResponse.estimate) {
                            window.location.href = `/app/accounting/transactions/estimate.nl?id=${objResponse.estimate}&cf=${libMapper.customForms.estimate}`;
                        }
                    });

                }
            }

            function failure(reason) {
                console.log('Failed: ' + reason);
            }

        }

        const getAtlassianQuote = (option) => {
            console.log('getAtlassianQuote | option', option)
            let strUrl = libMapper.script.link + libMapper.script.parent + libMapper.script.deployment
            let objCurrentRecord = currentRecord.get()
            var intCustomerId = objCurrentRecord.getValue('entity')
            var intSalesRepId = objCurrentRecord.getValue('salesrep')
            var intMacAccount = objCurrentRecord.getValue(libMapper.estimateFields.fields.macAccount.id);
            strUrl += `&view=getAtlassianQuote&estid=${option.estid}&mac=${option.macAccount || intMacAccount}`
            if (option.isNewEstRecord) {
                if (intCustomerId && intSalesRepId) {
                    console.log('macAccount | ' + intMacAccount, libMapper.estimateFields.fields.macAccount.id)
                    strUrl += `&custid=${intCustomerId}&salesRep=${intSalesRepId}`
                    displayAtlassianCart(strUrl)
                } else {
                    dialog.alert({
                        title: 'Missing Information',
                        message: 'Please ensure that you provide input in both the customer field and the Estimate owner field.'
                    });
                }
            } else {
                displayAtlassianCart(strUrl)
            }

            function displayAtlassianCart(strUrl) {
                windowHandler = nlExtOpenWindow(strUrl, '', 1300, 800, null, false, 'Atlassian Quote', null);
            }
        };

        const saveRecord = (scriptContext) => {
            return false;
        };


        const getRefreshQuote = (option) => {
            console.log('test', option)
            let strUrl = libMapper.script.link + libMapper.script.parent + libMapper.script.deployment
            let objCurrentRecord = currentRecord.get()
            var intMacAccount = objCurrentRecord.getValue('custbody_adap_atl_mac_account')
            strUrl += `&view=getRefreshQuote&estid=${option.estid}&mac=${intMacAccount}`
            windowHandler = nlExtOpenWindow(strUrl, '', 600, 500, null, false, 'Atlassian Quote Refresh', null);
        }

        return {
            pageInit,
            atlassiancart,
            saveRecord,
            generateQuote,
            getAtlassianQuote,
            getRefreshQuote,
        };
    });