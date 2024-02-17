/**
 * Version    Date            Author           Remarks
 * 1.00       9 Feb 2018      cmartinez        Initial Commit
 */

/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search', './UtilityLib'],
/**
 * @param {error} error
 * @param {record} record
 * @param {runtime} runtime
 * @param {task} task
 */
function(NS_Record, NS_Runtime, NS_Search, UtilityLib)
{
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context)
    {
    	var stLogTitle = 'onRequest';
    	var objResponse = context.response;

        var arrSupportedTypes = [];
        arrSupportedTypes.push('inventoryitem');

        var arrErrLine = [];

    	try
    	{
    		var stRecId = context.request.parameters.custparam_record_id;
    		var stRecType = context.request.parameters.custparam_record_type;
            var stAssets = (context.request.parameters.custparam_assets == 'T') ? true : false;

			log.debug(stLogTitle, 'Parameters > stRecId = ' + stRecId
					+ ' | stRecType = ' + stRecType);

			var stSuccessMessage = '';

            log.debug(stLogTitle, '================= Script Start =================');
            log.debug(stLogTitle, 'NS_Runtime.executionContext = ' + NS_Runtime.executionContext);

            if(stRecType == 'purchaseorder')
            {
                log.debug(stLogTitle, 'Receive Purchase Order.');
                record = NS_Record.transform({
                    fromType: 'purchaseorder',
                    fromId: stRecId,
                    toType: 'itemreceipt',
                    isDynamic: true,
                });

                var recPO = NS_Record.load({
                    type: 'purchaseorder',
                    id: stRecId,
                    isDynamic: true
                });

                // var stCreatedFrom = record.getValue({
                //     fieldId: 'createdfrom'
                // });

                // if(UtilityLib.isEmpty(stCreatedFrom))
                // {
                //     log.debug(stLogTitle, 'No parent record.');
                //     return;
                // }

                // var objParent = NS_Search.lookupFields({
                //     type: 'transaction',
                //     id: stCreatedFrom,
                //     columns: ['recordtype']
                // });

                // log.debug(stLogTitle, 'recordtype = ' + objParent['recordtype']);

                // if(objParent['recordtype'] != 'purchaseorder')
                // {
                //     log.debug(stLogTitle, 'Parent not a PO.');
                //     return;
                // }

                // var stLocation = objParent['location'][0].value;

                // log.debug(stLogTitle, 'stLocation = ' + stLocation);

                var intLines = record.getLineCount({
                    sublistId: 'item'
                });

                //cm
                // record.setValue({
                //     fieldId: 'landedcostmethod',
                //     value: 'WEIGHT'
                // });
                // record.setValue({
                //     fieldId: 'landedcostsource7',
                //     value: 'MANUAL'
                // });
                // record.setValue({
                //     fieldId: 'landedcostsource8',
                //     value: 'MANUAL'
                // });
                // record.setValue({
                //     fieldId: 'landedcostsource13',
                //     value: 'MANUAL'
                // });

                var arrItems = [];
                var arrLandedCostTemplate = [];
                for(var intLn = 0; intLn < intLines; intLn++)
                {
                    var stItem = record.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: intLn
                    });

                    var stLandedCostTemplate = record.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_scm_costcat_profile',
                        line: intLn
                    });

                    if(!UtilityLib.isEmpty(stItem))
                    {
                        arrItems.push(stItem);
                    }

                    if(!UtilityLib.isEmpty(stLandedCostTemplate))
                    {
                        arrLandedCostTemplate.push(stLandedCostTemplate);
                    }
                }

                var objLandedCost = {};
                if(!UtilityLib.isEmpty(arrLandedCostTemplate))
                {
                    var arrLCTFilters = [];
                    arrLCTFilters.push(NS_Search.createFilter({
                        name: 'internalid',
                        operator: NS_Search.Operator.ANYOF,
                        values: arrLandedCostTemplate
                    }));

                    var arrLCTColumns = [];
                    arrLCTColumns.push(NS_Search.createColumn({
                        name: 'internalid'
                    }));
                    arrLCTColumns.push(NS_Search.createColumn({
                        name: 'custrecord_scm_lc_dtl_factor',
                        join: 'custrecord_scm_lc_dtl_profile'
                    }));
                    arrLCTColumns.push(NS_Search.createColumn({
                        name: "custrecord_scm_lc_dtl_costcat",
                        join: 'custrecord_scm_lc_dtl_profile'
                    }));

                    var arrLCTResults = UtilityLib.search("customrecord_scm_lc_profile", null, arrLCTFilters, arrLCTColumns);

                    var intLCTResults = arrLCTResults.length;
                    for(var lc = 0; lc < intLCTResults; lc++)
                    {
                        var stLCT = arrLCTResults[lc].getValue({
                            name: 'internalid'
                        });
                        var flCostFactor = UtilityLib.forceFloat(arrLCTResults[lc].getValue({
                            name: 'custrecord_scm_lc_dtl_factor',
                            join: 'custrecord_scm_lc_dtl_profile'
                        }))/100;
                        var stCostCat = arrLCTResults[lc].getValue({
                            name: "custrecord_scm_lc_dtl_costcat",
                            join: 'custrecord_scm_lc_dtl_profile'
                        });

                        objLandedCost[stLCT] = {
                            costfactor: flCostFactor,
                            costcategory: stCostCat
                        };
                    }
                }

                //Only get items that are neither lot nor serial
                var objItemTypes = {};
                if(!UtilityLib.isEmpty(arrItems))
                {
                    var arrItemFilters = [];
                    arrItemFilters.push(NS_Search.createFilter({
                        name: 'internalid',
                        operator: NS_Search.Operator.ANYOF,
                        values: arrItems
                    }));
                    // arrItemFilters.push(NS_Search.createFilter({
                    //     name: 'islotitem',
                    //     operator: NS_Search.Operator.IS,
                    //     values: false
                    // }));
                    // arrItemFilters.push(NS_Search.createFilter({
                    //     name: 'isserialitem',
                    //     operator: NS_Search.Operator.IS,
                    //     values: false
                    // }));

                    var arrItemColumns = [];
                    // arrItemColumns.push(NS_Search.createColumn({
                    //     name: 'recordtype'
                    // }));
                    arrItemColumns.push(NS_Search.createColumn({
                        name: 'internalid'
                    }));

                    var arrItemResults = UtilityLib.search('item', null, arrItemFilters, arrItemColumns);

                    if(!UtilityLib.isEmpty(arrItemResults))
                    {
                        var intItemResults = arrItemResults.length;
                        for(var it = 0; it < intItemResults; it++)
                        {
                            var stItemId = arrItemResults[it].getValue({
                                name: 'internalid'
                            });
                            // var stItemType = arrItemResults[it].getValue({
                            //     name: 'recordtype'
                            // });

                            if(!UtilityLib.isEmpty(stItemId))
                            {
                                objItemTypes[stItemId] = true;
                            }
                        }
                    }
                }

                var objBins = getBinLocations();

                for(var intLn = 0; intLn < intLines; intLn++)
                {
                    log.debug(stLogTitle, '1');
                    record.selectLine({
                        sublistId: 'item',
                        line: intLn
                    });
                    recPO.selectLine({
                        sublistId: 'item',
                        line: intLn
                    });

                    var stItem = record.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item'
                    });

                    var stLineLocation = record.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'location'
                    });


                    // record.setCurrentSublistValue({
                    //     sublistId: 'item',
                    //     fieldId: 'custcol_scm_track_landed_cost',
                    //     value: true
                    // });
                    // record.setCurrentSublistValue({
                    //     sublistId: 'item',
                    //     fieldId: 'landedcostset',
                    //     value: true
                    // });

                    // if(objItemTypes[stItem] != true)
                    // {
                    //     continue;
                    // }

                    if(UtilityLib.isEmpty(objBins[stLineLocation]))
                    {
                        log.debug(stLogTitle, 'No Bin found for Line Location.');
                        var intErrLn = record.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'orderline'
                        });
                        arrErrLine.push(intErrLn);
                        continue;
                    }

                    // record.setCurrentSublistValue({
                    //     sublistId: 'item',
                    //     fieldId: 'itemreceive',
                    //     value: true
                    // });
                    // record.setCurrentSublistValue({
                    //     sublistId: 'item',
                    //     fieldId: 'location',
                    //     value: stLocation
                    // });

                    var stQuantity = record.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity'
                    });

                    var stRate = record.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate'
                    });

                        log.debug(stLogTitle, '2');
                    var subrecInventoryDetail = record.getCurrentSublistSubrecord({
                        sublistId: 'item',
                        fieldId: 'inventorydetail'
                    });
                    log.debug(stLogTitle, '3');
                    var boolHasSubrec = recPO.hasCurrentSublistSubrecord({
                        sublistId: 'item',
                        fieldId: 'inventorydetail'
                    });
                    var subrecInventoryDetailPO = null;
                    if(boolHasSubrec == true)
                    {
                        subrecInventoryDetailPO = recPO.getCurrentSublistSubrecord({
                            sublistId: 'item',
                            fieldId: 'inventorydetail'
                        });
                    }
                    log.debug(stLogTitle, 'subrecInventoryDetail = ' + subrecInventoryDetail
                        + ' | stQuantity = ' + stQuantity);

                    if(!UtilityLib.isEmpty(subrecInventoryDetail))
                    {
                        var intSubrec = subrecInventoryDetail.getLineCount({
                            sublistId: 'inventoryassignment'
                        });

                        if(intSubrec == 0)
                        {
                            subrecInventoryDetail.selectNewLine({
                                sublistId: 'inventoryassignment'
                            });
                            if(objItemTypes[stItem] == true)
                            {
                                subrecInventoryDetail.setCurrentSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'binnumber',
                                    value: objBins[stLineLocation]
                                });
                                subrecInventoryDetail.setCurrentSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'quantity',
                                    value: UtilityLib.forceFloat(stQuantity)
                                });
                            }
                            subrecInventoryDetail.setCurrentSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'inventorystatus',
                                value: '7'
                            });
                            subrecInventoryDetail.commitLine({
                                sublistId: 'inventoryassignment'
                            });
                        }
                        else if(intSubrec > 0)
                        {
                            for(var invDet = 0; invDet < intSubrec; invDet++)
                            {
                                subrecInventoryDetail.selectLine({
                                    sublistId: 'inventoryassignment',
                                    line: invDet
                                });
                                if(!UtilityLib.isEmpty(subrecInventoryDetailPO))
                                {
                                    subrecInventoryDetailPO.selectLine({
                                        sublistId: 'inventoryassignment',
                                        line: invDet
                                    });
                                }
                                if(objItemTypes[stItem] == true)
                                {
                                    subrecInventoryDetail.setCurrentSublistValue({
                                        sublistId: 'inventoryassignment',
                                        fieldId: 'binnumber',
                                        value: objBins[stLineLocation]
                                    });

                                    if(!UtilityLib.isEmpty(subrecInventoryDetailPO))
                                    {
                                        var stSerialQty = subrecInventoryDetailPO.getCurrentSublistValue({
                                            sublistId: 'inventoryassignment',
                                            fieldId: 'quantity'
                                        });
                                    }

                                    if(UtilityLib.isEmpty(stSerialQty))
                                    {
                                        subrecInventoryDetail.setCurrentSublistValue({
                                            sublistId: 'inventoryassignment',
                                            fieldId: 'quantity',
                                            value: UtilityLib.forceFloat(stQuantity)
                                        });
                                    }
                                    else
                                    {
                                        log.debug(stLogTitle, 'stSerialQty = ' + stSerialQty);
                                        subrecInventoryDetail.setCurrentSublistValue({
                                            sublistId: 'inventoryassignment',
                                            fieldId: 'quantity',
                                            value: UtilityLib.forceFloat(stSerialQty)
                                        });
                                    }
                                }
                                subrecInventoryDetail.setCurrentSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'inventorystatus',
                                    value: '7'
                                });
                                subrecInventoryDetail.commitLine({
                                    sublistId: 'inventoryassignment'
                                });
                            }
                        }
                    }

                    var stLineLCT = record.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_scm_costcat_profile'
                    });

                    log.debug(stLogTitle, 'A = ' + JSON.stringify(objLandedCost));
                    if(!UtilityLib.isEmpty(objLandedCost[stLineLCT]))
                    {
                        var flAmount = UtilityLib.forceFloat(stQuantity) * UtilityLib.forceFloat(stRate);
                        if(UtilityLib.isEmpty(stQuantity))
                        {
                            flAmount = UtilityLib.forceFloat(stRate);
                        }

                        var flTemp = flAmount * objLandedCost[stLineLCT].costfactor;

                        if(flTemp != 0)
                        {
                            var landedCost = record.getCurrentSublistSubrecord({
                                sublistId: 'item',
                                fieldId: 'landedcost'
                            });
                            landedCost.selectNewLine({
                                sublistId: 'landedcostdata'
                            });
                            landedCost.setCurrentSublistValue({
                                sublistId: 'landedcostdata',
                                fieldId: 'costcategory',
                                value: objLandedCost[stLineLCT].costcategory
                            });

                            landedCost.setCurrentSublistValue({
                                sublistId: 'landedcostdata',
                                fieldId: 'amount',
                                value: flAmount * objLandedCost[stLineLCT].costfactor
                            });

                            landedCost.commitLine({
                                sublistId: 'landedcostdata'
                            });
                        }
                    }

                    // record.setCurrentSublistValue({
                    //     sublistId: 'item',
                    //     fieldId: 'description',
                    //     value: 'test'
                    // });
                    // record.setCurrentSublistValue({
                    //     sublistId: 'item',
                    //     fieldId: 'custcol_scm_costcat_profile',
                    //     value: '5'
                    // });
                    // record.setCurrentSublistValue({
                    //     sublistId: 'item',
                    //     fieldId: 'custcol_scm_lc_autocalc',
                    //     value: true
                    // });
                    // record.setCurrentSublistValue({
                    //     sublistId: 'item',
                    //     fieldId: 'custcol_imb_note',
                    //     value: 'test note'
                    // });

                    record.commitLine({
                        sublistId: 'item'
                    });
                }

                var stId = record.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
            }
            else if(stRecType == 'returnauthorization')
            {
                log.debug(stLogTitle, 'Receive Return Authorization.');
                record = NS_Record.transform({
                    fromType: 'returnauthorization',
                    fromId: stRecId,
                    toType: 'itemreceipt',
                    isDynamic: true,
                });

                // get subsidiary
                var stSubsidiary = record.getValue({
                    fieldId: 'subsidiary'
                });
                // var stCreatedFrom = record.getValue({
                //     fieldId: 'createdfrom'
                // });

                // if(UtilityLib.isEmpty(stCreatedFrom))
                // {
                //     log.debug(stLogTitle, 'No parent record.');
                //     return;
                // }

                // var objParent = NS_Search.lookupFields({
                //     type: 'transaction',
                //     id: stCreatedFrom,
                //     columns: ['recordtype']
                // });

                // log.debug(stLogTitle, 'recordtype = ' + objParent['recordtype']);

                // if(objParent['recordtype'] != 'purchaseorder')
                // {
                //     log.debug(stLogTitle, 'Parent not a PO.');
                //     return;
                // }

                // var stLocation = objParent['location'][0].value;

                // log.debug(stLogTitle, 'stLocation = ' + stLocation);

                var intLines = record.getLineCount({
                    sublistId: 'item'
                });

                var arrItems = [];
                for(var intLn = 0; intLn < intLines; intLn++)
                {
                    var stItem = record.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: intLn
                    });

                    if(!UtilityLib.isEmpty(stItem))
                    {
                        arrItems.push(stItem);
                    }
                }

                //Only get items that are neither lot nor serial
                var objItemTypes = {};
                if(!UtilityLib.isEmpty(arrItems))
                {
                    var arrItemFilters = [];
                    arrItemFilters.push(NS_Search.createFilter({
                        name: 'internalid',
                        operator: NS_Search.Operator.ANYOF,
                        values: arrItems
                    }));
                    arrItemFilters.push(NS_Search.createFilter({
                        name: 'islotitem',
                        operator: NS_Search.Operator.IS,
                        values: false
                    }));
                    arrItemFilters.push(NS_Search.createFilter({
                        name: 'isserialitem',
                        operator: NS_Search.Operator.IS,
                        values: false
                    }));

                    var arrItemColumns = [];
                    // arrItemColumns.push(NS_Search.createColumn({
                    //     name: 'recordtype'
                    // }));
                    arrItemColumns.push(NS_Search.createColumn({
                        name: 'internalid'
                    }));

                    var arrItemResults = UtilityLib.search('item', null, arrItemFilters, arrItemColumns);

                    if(!UtilityLib.isEmpty(arrItemResults))
                    {
                        var intItemResults = arrItemResults.length;
                        for(var it = 0; it < intItemResults; it++)
                        {
                            var stItemId = arrItemResults[it].getValue({
                                name: 'internalid'
                            });
                            // var stItemType = arrItemResults[it].getValue({
                            //     name: 'recordtype'
                            // });

                            if(!UtilityLib.isEmpty(stItemId))
                            {
                                objItemTypes[stItemId] = true;
                            }
                        }
                    }
                }

                var objBins = getReturnBinLocations(stAssets);

                for(var intLn = 0; intLn < intLines; intLn++)
                {
                    record.selectLine({
                        sublistId: 'item',
                        line: intLn
                    });

                    var stItem = record.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item'
                    });

                    var stLineLocation = record.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'location'
                    });

                    // if(objItemTypes[stItem] != true)
                    // {
                    //     continue;
                    // }

                    if(UtilityLib.isEmpty(objBins[stLineLocation]) && !stAssets)
                    {
                        log.debug(stLogTitle, 'No Bin found for Line Location.');
                        var intErrLn = record.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'orderline'
                        });
                        arrErrLine.push(intErrLn);
                        continue;
                    } else if (stAssets && UtilityLib.isEmpty(objBins[stSubsidiary])) {
                        log.debug(stLogTitle, 'No Bin found for Subsidiary.');
                        var intErrLn = record.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'orderline'
                        });
                        arrErrLine.push(intErrLn);
                        throw 'No Bin found for Subsidiary.';
                    } else if (stAssets && UtilityLib.isEmpty(objBins[stSubsidiary][stLineLocation])) {
                        log.debug(stLogTitle, 'No Bin found for Subsidiary and Location.');
                        var intErrLn = record.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'orderline'
                        });
                        arrErrLine.push(intErrLn);
                        throw 'No Bin found for Subsidiary and Location.';
                    }

                    // record.setCurrentSublistValue({
                    //     sublistId: 'item',
                    //     fieldId: 'itemreceive',
                    //     value: true
                    // });
                    // record.setCurrentSublistValue({
                    //     sublistId: 'item',
                    //     fieldId: 'location',
                    //     value: stLocation
                    // });

                    var stQuantity = record.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity'
                    });

                    var subrecInventoryDetail = record.getCurrentSublistSubrecord({
                        sublistId: 'item',
                        fieldId: 'inventorydetail'
                    });
                    log.debug(stLogTitle, 'subrecInventoryDetail = ' + subrecInventoryDetail
                        + ' | stQuantity = ' + stQuantity);

                    if(!UtilityLib.isEmpty(subrecInventoryDetail))
                    {
                        var intSubrec = subrecInventoryDetail.getLineCount({
                            sublistId: 'inventoryassignment'
                        });

                        if(intSubrec == 0)
                        {
                            subrecInventoryDetail.selectNewLine({
                                sublistId: 'inventoryassignment'
                            });
                        }
                        else
                        {
                            subrecInventoryDetail.selectLine({
                                sublistId: 'inventoryassignment',
                                line: 0
                            });
                        }

                        if(objItemTypes[stItem] == true)
                        {
                            if (!stAssets) {
                                subrecInventoryDetail.setCurrentSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'binnumber',
                                    value: objBins[stLineLocation]
                                });
                            } else {
                                subrecInventoryDetail.setCurrentSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'binnumber',
                                    value: objBins[stSubsidiary][stLineLocation].bin
                                });
                            }
                            subrecInventoryDetail.setCurrentSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'quantity',
                                value: UtilityLib.forceFloat(stQuantity)
                            });
                        }

                        if (!stAssets) {
                            subrecInventoryDetail.setCurrentSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'inventorystatus',
                                value: '7'
                            });
                        } else {
                            subrecInventoryDetail.setCurrentSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'inventorystatus',
                                value: objBins[stSubsidiary][stLineLocation].status
                            });
                        }
                        subrecInventoryDetail.commitLine({
                            sublistId: 'inventoryassignment'
                        });
                    }
                    record.commitLine({
                        sublistId: 'item'
                    });
                }

                var stId = record.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
            }
            else if(stRecType == 'inboundshipment')
            {
                var objBins = getBinLocations();

                log.debug(stLogTitle, 'Receive Inbound Shipment.');
                var recBulkReceive = NS_Record.load({
                    type: NS_Record.Type.RECEIVE_INBOUND_SHIPMENT,
                    id: stRecId,
                    isDynamic: true
                });
                var intLines = recBulkReceive.getLineCount({
                    sublistId: 'receiveitems'
                });

                var arrItems = [];
                for(var intLn = 0; intLn < intLines; intLn++)
                {
                    var stItem = recBulkReceive.getSublistValue({
                        sublistId: 'receiveitems',
                        fieldId: 'item',
                        line: intLn
                    });

                    if(!UtilityLib.isEmpty(stItem))
                    {
                        arrItems.push(stItem);
                    }
                }

                //Only get items that are neither lot nor serial
                var objItemTypes = {};
                if(!UtilityLib.isEmpty(arrItems))
                {
                    var arrItemFilters = [];
                    arrItemFilters.push(NS_Search.createFilter({
                        name: 'internalid',
                        operator: NS_Search.Operator.ANYOF,
                        values: arrItems
                    }));
                    arrItemFilters.push(NS_Search.createFilter({
                        name: 'islotitem',
                        operator: NS_Search.Operator.IS,
                        values: false
                    }));
                    arrItemFilters.push(NS_Search.createFilter({
                        name: 'isserialitem',
                        operator: NS_Search.Operator.IS,
                        values: false
                    }));

                    var arrItemColumns = [];
                    // arrItemColumns.push(NS_Search.createColumn({
                    //     name: 'recordtype'
                    // }));
                    arrItemColumns.push(NS_Search.createColumn({
                        name: 'internalid'
                    }));

                    var arrItemResults = UtilityLib.search('item', null, arrItemFilters, arrItemColumns);

                    if(!UtilityLib.isEmpty(arrItemResults))
                    {
                        var intItemResults = arrItemResults.length;
                        for(var it = 0; it < intItemResults; it++)
                        {
                            var stItemId = arrItemResults[it].getValue({
                                name: 'internalid'
                            });
                            // var stItemType = arrItemResults[it].getValue({
                            //     name: 'recordtype'
                            // });

                            if(!UtilityLib.isEmpty(stItemId))
                            {
                                objItemTypes[stItemId] = true;
                            }
                        }
                    }
                }

                for(var r = 0; r < intLines; r++)
                {
                    recBulkReceive.selectLine({
                        sublistId: 'receiveitems',
                        line: r
                    });

                    var stQuantity = recBulkReceive.getCurrentSublistValue({
                        sublistId: 'receiveitems',
                        fieldId: 'quantityremaining'
                    });

                    var stLineLocation = recBulkReceive.getCurrentSublistValue({
                        sublistId: 'receiveitems',
                        fieldId: 'receivinglocation'
                    });
                    if(UtilityLib.isEmpty(objBins[stLineLocation]))
                    {
                        log.debug(stLogTitle, 'No Bin found for Line Location.');
                        var intErrLn = r + 1;
                        arrErrLine.push(intErrLn);
                        continue;
                    }

                    var subrecInventoryDetail = recBulkReceive.getCurrentSublistSubrecord({
                        sublistId: 'receiveitems',
                        fieldId: 'inventorydetail'
                    });
                    log.debug(stLogTitle, 'subrecInventoryDetail = ' + subrecInventoryDetail
                        + ' | stQuantity = ' + stQuantity);

                    if(!UtilityLib.isEmpty(subrecInventoryDetail))
                    {
                        var intSubrec = subrecInventoryDetail.getLineCount({
                            sublistId: 'inventoryassignment'
                        });

                        if(intSubrec == 0)
                        {
                            subrecInventoryDetail.selectNewLine({
                                sublistId: 'inventoryassignment'
                            });
                        }
                        else
                        {
                            subrecInventoryDetail.selectLine({
                                sublistId: 'inventoryassignment',
                                line: 0
                            });
                        }

                        if(objItemTypes[stItem] == true)
                        {
                            subrecInventoryDetail.setCurrentSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'binnumber',
                                value: objBins[stLineLocation]
                            });
                            subrecInventoryDetail.setCurrentSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'quantity',
                                value: UtilityLib.forceFloat(stQuantity)
                            });
                        }
                        subrecInventoryDetail.setCurrentSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'inventorystatus',
                            value: '7'
                        });
                        subrecInventoryDetail.commitLine({
                            sublistId: 'inventoryassignment'
                        });
                    }
                    recBulkReceive.commitLine({
                        sublistId: 'receiveitems'
                    });
                }

                var stInboundShipReceipt = recBulkReceive.save();
                log.debug(stLogTitle, 'stInboundShipReceipt = ' + stInboundShipReceipt);
            }

            log.debug(stLogTitle, '================= Script End ===================');

			objResponse.write(JSON.stringify({
                status : 200,
                message : stId
            }));
    	}
    	catch(objError)
    	{
    		if(objError.message != undefined)
			{
    			log.error('ERROR', 'Details: ' + objError.name + ' ' + objError.message);
			}
			else
			{
				log.error('ERROR', objError.toString());
			}

    		var stMessage =  arrErrLine.join(', ');
    		objResponse.write(JSON.stringify({
                status : 500,
                message : stMessage
            }));
    	}
    }

    function getBinLocations()
    {
        var stLogTitle = 'getBinLocations';
        var objBinLocations = {};

        try
        {
            var arrBinFilters = [
                ['custrecord_rfs_is_default_receive', 'is', true],
                'or',
                ['custrecord_imb_default_rma_receiving', 'is', true]
            ];

            var arrBinColumns = [];
            arrBinColumns.push(NS_Search.createColumn({
                name: 'internalid'
            }));
            arrBinColumns.push(NS_Search.createColumn({
                name: 'location'
            }));
            arrBinColumns.push(NS_Search.createColumn({
                name: 'custrecord_rfs_is_default_receive'
            }));

            var arrBinResults = UtilityLib.search('bin', null, arrBinFilters, arrBinColumns);

            if(!UtilityLib.isEmpty(arrBinResults))
            {
                for(var intBin = 0; intBin < arrBinResults.length; intBin++)
                {
                    var stBinId = arrBinResults[intBin].getValue({
                        name: 'internalid'
                    });
                    var stBinLocation = arrBinResults[intBin].getValue({
                        name: 'location'
                    });
                    var boolDefaultReceivingBnin = arrBinResults[intBin].getValue({
                        name: 'custrecord_rfs_is_default_receive'
                    });

                    if(!UtilityLib.isEmpty(stBinLocation) && boolDefaultReceivingBnin == true)
                    {
                        objBinLocations[stBinLocation] = stBinId;
                    }
                }
            }
        }
        catch(error)
        {
            if (error.message != undefined)
            {
                log.error('Process Error', error.name + ' : ' + error.message);
            }
            else
            {
                log.error('Unexpected Error', error.toString());
            }
        }

        return objBinLocations;
    }

    function getReturnBinLocations(assets = false)
    {
        var stLogTitle = 'getReturnBinLocations';
        var objBinLocations = {};

        try
        {
            if (!assets) { // original code
                var arrBinFilters = [
                    ['custrecord_imb_default_rma_receiving', 'is', true]
                ];

                var arrBinColumns = [];
                arrBinColumns.push(NS_Search.createColumn({
                    name: 'internalid'
                }));
                arrBinColumns.push(NS_Search.createColumn({
                    name: 'location'
                }));
                arrBinColumns.push(NS_Search.createColumn({
                    name: 'custrecord_imb_default_rma_receiving'
                }));

                var arrBinResults = UtilityLib.search('bin', null, arrBinFilters, arrBinColumns);

                if(!UtilityLib.isEmpty(arrBinResults))
                {
                    for(var intBin = 0; intBin < arrBinResults.length; intBin++)
                    {
                        var stBinId = arrBinResults[intBin].getValue({
                            name: 'internalid'
                        });
                        var stBinLocation = arrBinResults[intBin].getValue({
                            name: 'location'
                        });
                        var boolDefaultReceivingBnin = arrBinResults[intBin].getValue({
                            name: 'custrecord_imb_default_rma_receiving'
                        });

                        if(!UtilityLib.isEmpty(stBinLocation) && boolDefaultReceivingBnin == true)
                        {
                            objBinLocations[stBinLocation] = stBinId;
                        }
                    }
                }
            } else { // new code
                /**
                 * Change IMB-2255/IP-3083
                 * Ahv de combinatie Subsidiary (header) + locatie (detail) de Inventory Detail velden Bin en Status op regelniveau vullen. 
                 * (deze waarden komen uit een custom record https://5143375-sb1.app.netsuite.com/app/common/custom/custrecordentrylist.nl?rectype=1469) 
                 */
                // search on customrecord_imb_ws_inv_det_bin_mapping
                var mappingSearch = NS_Search.create({
                    type: 'customrecord_imb_ws_inv_det_bin_mapping',
                    filters: [
                        "isinactive", "is", "F"
                    ],
                    columns: [
                        NS_Search.createColumn({
                            name: 'custrecord_imb_ws_mapping_sub'
                        }),
                        NS_Search.createColumn({
                            name: 'custrecord_imb_ws_mapping_loc'
                        }),
                        NS_Search.createColumn({
                            name: 'custrecord_imb_ws_mapping_bin'
                        }),
                        NS_Search.createColumn({
                            name: 'custrecord_imb_inv_stat'
                        })
                    ]
                });
                // run search with each
                mappingSearch.run().each(function(result) {
                    // structure: {${subsidiary}: {${location} : { bin: ${bin}, status: ${status}}}
                    var subsidiary = result.getValue({
                        name: 'custrecord_imb_ws_mapping_sub'
                    });
                    var location = result.getValue({
                        name: 'custrecord_imb_ws_mapping_loc'
                    });
                    var bin = result.getValue({
                        name: 'custrecord_imb_ws_mapping_bin'
                    });
                    var status = result.getValue({
                        name: 'custrecord_imb_inv_stat'
                    });
                    if (!objBinLocations[subsidiary]) {
                        objBinLocations[subsidiary] = {};
                    }
                    if (!objBinLocations[subsidiary][location]) {
                        objBinLocations[subsidiary][location] = {};
                    }
                    objBinLocations[subsidiary][location] = {
                        bin: bin,
                        status: status
                    };
                    return true;
                });
            }
        }
        catch(error)
        {
            if (error.message != undefined)
            {
                log.error('Process Error', error.name + ' : ' + error.message);
            }
            else
            {
                log.error('Unexpected Error', error.toString());
            }
        }

        return objBinLocations;
    }

    function splitAndTrim(stValue)
    {
    	if(!stValue) return null;

    	return stValue.toLowerCase().replace(/\s+/g,'').split(',');
    }

    return {
        onRequest: onRequest
    };

});
