/**
 * * Version	Date			Author			Remarks
 * 	 1.00		9 Feb 2018     Carlo Martinez	Initial version
 */

/**
 * @NApiVersion 2.1
 */
define(['N/https', 'N/ui/dialog', 'N/url', 'N/currentRecord', 'N/search', 'N/record', './UtilityLib.js', 'N/runtime'],
function(NS_Https, NS_Dialog, NS_Url, NS_CurrentRecord, NS_Search, NS_Record, UtilityLib, NS_Runtime )
{
	function createReceipt(stTriggerSLUrl, assets = false, stRecId)
	{
		NS_Dialog.confirm({
			title: 'Confirm Action',
			message: 'This action will create item receipt with filled inventory detail. Continue?'
		}).then(function(bYes)
		{
			if(bYes && !isEmpty(stTriggerSLUrl))
	        {
                var boolInProcess = false;
                if(NS_CurrentRecord.get().type == 'purchaseorder' || NS_CurrentRecord.get().type == 'returnauthorization')
                {
                    var objCurrent = NS_Search.lookupFields({
                        type: NS_CurrentRecord.get().type,
                        id: NS_CurrentRecord.get().id,
                        columns: ['custbody_imb_ir_ongoing']
                    });
                    boolInProcess = objCurrent['custbody_imb_ir_ongoing'];
                }
                else
                {
                    boolInProcess = false;
                }

                if(boolInProcess == true)
                {
                    var stErrorMessage = 'Item Receipt Creation ongoing.';
                    // if(!isEmpty(obj.message))
                    // {
                    //     stErrorMessage += ' Lines: ' + obj.message;
                    // }
                    NS_Dialog.alert({
                        title: 'Message',
                        message: stErrorMessage
                    }).then(function(response) {
                        var objWindow = window.self;
                        objWindow.location.reload();
                    }).catch(function onError(reason) {
                        var objWindow = window.self;
                        objWindow.location.reload();
                    });
                }
                else
                {
                    if(NS_CurrentRecord.get().type == 'purchaseorder' || NS_CurrentRecord.get().type == 'returnauthorization')
                    {
                        NS_Record.submitFields({
                            type: NS_CurrentRecord.get().type,
                            id: NS_CurrentRecord.get().id,
                            values: {
                                'custbody_imb_ir_ongoing' : true
                            }
                        });
                    }
                }

	            try
	            {
                    if (assets) {
                        stTriggerSLUrl += '&custparam_assets=T';
                    }
	            	displayOverlay('In progress...');
	                	NS_Https.get.promise({
	                        url : stTriggerSLUrl
	                    }).then(function(response) {
	                        if(!isEmpty(response)) {
	                            var obj = JSON.parse(response.body);
                                if(UtilityLib.forceInt(obj.status) == 200)
                                {
                                	if(NS_CurrentRecord.get().type == 'purchaseorder' || NS_CurrentRecord.get().type == 'returnauthorization')
                                	{
                                        removeOverlay();
                                        if (!assets) {
                                            NS_Record.submitFields({
                                                type: NS_CurrentRecord.get().type,
                                                id: NS_CurrentRecord.get().id,
                                                values: {
                                                    'custbody_imb_ir_ongoing' : false
                                                }
                                            });
                                        } else {
                                            console.log('assets logic here1')
                                            try {
                                            NS_Record.submitFields({
                                                type: NS_CurrentRecord.get().type,
                                                id: NS_CurrentRecord.get().id,
                                                values: {
                                                    'custbody_imb_ir_ongoing' : false,
                                                    // 'orderstatus' : 'H',
                                                    // fill custbody_imb_secondary_sales with the current user
                                                    'custbody_imb_secondary_sales': NS_Runtime.getCurrentUser().id,
                                                    'custbody_imb_status_rma': 5
                                                }
                                            });
                                            } catch (e) {
                                                console.error('assets logic here',JSON.stringify(e))
                                            }
                                        }
                                        console.log('responseToResolve',obj) 
                                        if (stRecId){
                                            var stRecUrl   = NS_Url.resolveRecord({
                                                recordType: 'supportcase',
                                                recordId: stRecId,
                                                isEditMode: false
                                            });
                                            window.ischanged = false;
                                            window.open(stRecUrl, '_self');
                                        } else {
                                            var stRecUrl   = NS_Url.resolveRecord({
                                                recordType: 'itemreceipt',
                                                recordId: obj.message,
                                                isEditMode: false
                                            });
                                            window.ischanged = false;
                                            window.open(stRecUrl, '_self');
                                        }
	                                }
	                                else
	                                {
	                                	var stRecUrl   = NS_Url.resolveRecord({
	                                        recordType: 'inboundshipment',
	                                        recordId: NS_CurrentRecord.get().id,
	                                        isEditMode: false
	                                    });
                                        setTimeout(function () {
                                            var objWindow = window.self;
                                            objWindow.location.reload();
                                        }, 10000);
	                                }
                                }
                                else
                                {
                                    removeOverlay();
                                    if(NS_CurrentRecord.get().type == 'purchaseorder' || NS_CurrentRecord.get().type == 'returnauthorization')
                                	{
                                        NS_Record.submitFields({
                                            type: NS_CurrentRecord.get().type,
                                            id: NS_CurrentRecord.get().id,
                                            values: {
                                                'custbody_imb_ir_ongoing' : false
                                            }
                                        });
                                    }
                                	var stErrorMessage = 'Ontbrekende voorraad gegevens of ontbrekend lot-nummer ingevuld, vul dit aan in de Inkooporder. Dit kan ook komen door ontbrekende bin locatie setup.';
                                	if(!isEmpty(obj.message))
                                	{
                                		stErrorMessage += ' Lines: ' + obj.message;
                                	}
                                    NS_Dialog.alert({
                                        title: 'Message',
                                        message: stErrorMessage
                                    }).then(function(response) {
				                        var objWindow = window.self;
                                    	objWindow.location.reload();
				                    }).catch(function onError(reason) {
				                        var objWindow = window.self;
                                    	objWindow.location.reload();
				                    });

                                }
	                        }
	                    }).catch(function onRejected(reason) {
                            if(NS_CurrentRecord.get().type == 'purchaseorder' || NS_CurrentRecord.get().type == 'returnauthorization')
                            {
                                NS_Record.submitFields({
                                    type: NS_CurrentRecord.get().type,
                                    id: NS_CurrentRecord.get().id,
                                    values: {
                                        'custbody_imb_ir_ongoing' : false
                                    }
                                });
                            }
	                        log.debug({
	                            title: 'Invalid Get Request: ',
	                            details: reason
	                        });
	                    });
	            }
	            catch (e)
	            {
                    if(NS_CurrentRecord.get().type == 'purchaseorder' || NS_CurrentRecord.get().type == 'returnauthorization')
                    {
                        NS_Record.submitFields({
                            type: NS_CurrentRecord.get().type,
                            id: NS_CurrentRecord.get().id,
                            values: {
                                'custbody_imb_ir_ongoing' : false
                            }
                        });
                    }
	                console.error(stLogTitle, e.toString());
	                throw e;
	            }
	        }
		}).catch(function onFail(reason) {
            log.debug({
                title: 'Error',
                details: reason
            });
        });
	}

	 /**
	 * Overlay screen with the text provided
	 * using jQuery
	 * @param text
	 */
	function displayOverlay(text)
	{
	    jQuery("<table id='overlay'><tbody><tr><td>" + text + "</td></tr></tbody></table>").css({
	        "position": "fixed",
	        "top": "0px",
	        "left": "0px",
	        "width": "100%",
	        "height": "100%",
	        "background-color": "rgba(0,0,0,.5)",
	        "z-index": "10000",
	        "vertical-align": "middle",
	        "text-align": "center",
	        "color": "#fff",
	        "font-size": "20px",
	        "font-weight": "bold",
	        "cursor": "wait"
	    }).appendTo("body");
	}

	/**
	 * Remove overlay of the screen
	 * using jQuery
	 */
	function removeOverlay() {
	    jQuery("#overlay").remove();
	}

    /**
     * This function validates if input is empty
     * @returns {Boolean}
     */
	function isEmpty(stValue)
	{
		return ((stValue === '' || stValue == null || stValue == undefined) || (stValue.constructor === Array && stValue.length == 0) || (stValue.constructor === Object && (function(v)
		{
			for ( var k in v)
				return false;
			return true;
		})(stValue)));
	};

	return {
		createReceipt : createReceipt
	};
});
