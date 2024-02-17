/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/search','N/record','N/query', 'N/file', 'N/email','N/format'],

function(search,record,query, file, email,format) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
        log.debug('Scheduled Script', 'Scheduled Script Executed');
        
        var currentDate = new Date();

        log.debug('currentDate',currentDate)
        // Calculate the date 5 days from now
        var fiveDaysFromNow = new Date(currentDate);
        fiveDaysFromNow.setDate(currentDate.getDate() + 5);

        var fiveDaysFromNowDate = format.format({
            value: fiveDaysFromNow,
            type: format.Type.DATE
        });

        log.debug('fiveDaysFromNow',fiveDaysFromNow)
        log.debug('fiveDaysFromNowDate',fiveDaysFromNowDate)
        // Calculate the date 11 days from now
        var elevenDaysFromNow = new Date(currentDate);
        elevenDaysFromNow.setDate(currentDate.getDate() + 11);

        var elevenDaysFromNowDate = format.format({
            value: elevenDaysFromNow,
            type: format.Type.DATE
        });

        log.debug('elevenDaysFromNow',elevenDaysFromNow)
        log.debug('elevenDaysFromNowDate',elevenDaysFromNowDate)

        //var transferOrderSearchColInternalId = search.createColumn({ name: 'internalid'});
        var transferOrderSearchColFromOutlet = search.createColumn({ name: 'location', summary: search.Summary.GROUP });
        var transferOrderSearchColToOutlet = search.createColumn({ name: 'transferlocation', summary: search.Summary.GROUP });
        var transferOrderSearchColItemInternalIdSPCZV = search.createColumn({ name: 'internalid', join: 'item', summary: search.Summary.GROUP });
        var transferOrderSearchColItem = search.createColumn({ name: 'formulatext', summary: search.Summary.GROUP, formula: '{item} || \' \' || {item.displayname}' });
        var transferOrderSearchColQuantity = search.createColumn({ name: 'quantityuom', summary: search.Summary.SUM, function: 'absoluteValue' });
        var transferOrderSearchColUnits = search.createColumn({ name: 'unit', summary: search.Summary.GROUP });
        var transferOrderSearchColAmount = search.createColumn({ name: 'amount', summary: search.Summary.SUM, function: 'absoluteValue' });
        var transferOrderSearchColUnitCost = search.createColumn({ name: 'formulacurrency', summary: search.Summary.AVG, formula: '{amount}/{quantityuom}' });
    
        var transferOrderSearch = search.create({
            type: 'transferorder',
            filters:  [
                ['type', 'anyof', 'TrnfrOrd'],
                'AND',
                ['mainline', 'is', 'F'],
                'AND',
                ['custbody_conso', 'is', 'F'],
                'AND',
                ['status', 'noneof', 'TrnfrOrd:H', 'TrnfrOrd:A'],
                'AND',
                ['formulanumeric: CASE WHEN {transactionlinetype}=\'Item\' then {line} else NULL end', 'isnotempty', ''],
                'AND',
                ['trandate', 'within', fiveDaysFromNowDate, elevenDaysFromNowDate],
            ],
            columns: [
               // transferOrderSearchColInternalId,
                transferOrderSearchColFromOutlet,
                transferOrderSearchColToOutlet,
                transferOrderSearchColItemInternalIdSPCZV,
                transferOrderSearchColItem,
                transferOrderSearchColQuantity,
                transferOrderSearchColUnits,
                transferOrderSearchColAmount,
                transferOrderSearchColUnitCost
            ],
        });
        
        // // Note: Search.run() is limited to 4,000 results
        // transferOrderSearch.run().each((result: search.Result): boolean => {
        //     // ...
        //
        //     return true;
        // });
        var SRArray = [];
        var transferOrderSearchPagedData = transferOrderSearch.runPaged({ pageSize: 1000 });
        for (var i = 0; i < transferOrderSearchPagedData.pageRanges.length; i++) {
            var transferOrderSearchPage = transferOrderSearchPagedData.fetch({ index: i });
            transferOrderSearchPage.data.forEach(function (result){
                //var internalId = result.getValue(transferOrderSearchColInternalId);
                var fromOutlet = result.getValue(transferOrderSearchColFromOutlet);
                var toOutlet = result.getValue(transferOrderSearchColToOutlet);
                var itemInternalIdSPCZV = result.getValue(transferOrderSearchColItemInternalIdSPCZV);
                var item = result.getValue(transferOrderSearchColItem);
                var quantity = result.getValue(transferOrderSearchColQuantity);
                var units = result.getValue(transferOrderSearchColUnits);
                var amount = result.getValue(transferOrderSearchColAmount);
                var unitCost = result.getValue(transferOrderSearchColUnitCost);
        
                // ...
                SRArray.push({
                   // "id": internalId,
                    "fOutlet": fromOutlet,
                    "tOutlet": toOutlet,
                    "item": item,
                    "qty": quantity,
                    "units": units,
                    "amt": amount,
                    "unitCost": unitCost,
                    "itemId": itemInternalIdSPCZV
                })
            });
        }

        var groupedFrom = {};

        for (var i = 0; i < SRArray.length; i++) {
            var SRArrayF = SRArray[i];
            var fOutlet = SRArrayF.fOutlet;
            //var category = menuDate.category;

            if (!groupedFrom[fOutlet] ) {
                groupedFrom[fOutlet] = [];
            }
            /*if (!groupedDate[date][category]) {
                groupedDate[date][category] = [];
            }*/
            
            groupedFrom[fOutlet].push(SRArrayF);
        }

        log.debug("Grouped outlet From:",groupedFrom)
        for (var fOutlet in groupedFrom) {
            var group1Loc = groupedFrom[fOutlet];
            log.debug("objData group1Loc:",group1Loc)
            var groupedTo = {};
            for (var k = 0; k < group1Loc.length; k++) {
                var SRArrayT = group1Loc[k];
                var tOutlet = SRArrayT.tOutlet;
        
                if (!groupedTo[tOutlet] ) {
                    groupedTo[tOutlet] = [];
                }
                /*if (!groupedDate[date][category]) {
                    groupedDate[date][category] = [];
                }*/
                
                groupedTo[tOutlet].push(SRArrayT);
            }

            log.debug("Grouped Outlet To:",groupedTo)
            //var groupedSRId = [];
            for (var tOutlet in groupedTo) {
                var group2Loc = groupedTo[tOutlet];
                log.debug("objData group2Loc:",group2Loc)
                //for (var i = 0; i < group2Cat.length; i++) {
                  
                    var fLocObj = group2Loc[0].fOutlet;
                    var tLocObj = group2Loc[0].tOutlet;
                    log.debug("fLocObj", fLocObj)
                    log.debug("tLocObj", tLocObj)
                    //var titleCanteen = eventNameCos+' '+dateOnly+' '+group2Cat[0].category;
                    //log.debug("titleCanteen", titleCanteen)
                    
                    var srRec = record.create({
                        type: record.Type.TRANSFER_ORDER,
                    })

                    srRec.setValue({
                        fieldId: 'subsidiary',
                        value: 3
                    })

                    srRec.setValue({
                        fieldId: 'location',
                        value: fLocObj
                    })

                    srRec.setValue({
                        fieldId: 'transferlocation',
                        value: tLocObj
                    })

                    srRec.setValue({
                        fieldId: 'incoterm',
                        value: 1
                    })

                    srRec.setValue({
                        fieldId: 'orderstatus',
                        value: 'B'
                    })

                    srRec.setValue({
                        fieldId: 'custbody_conso',
                        value: true
                    })
            
                    for(var l = 0; l<group2Loc.length;l++){
                        srRec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: l,
                            value: group2Loc[l].itemId
                        });

                        srRec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: l,
                            value: group2Loc[l].qty
                        });

                        srRec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'units',
                            line: l,
                            value: group2Loc[l].units
                        });

                        srRec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: l,
                            value: group2Loc[l].amt
                        });

                        srRec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            line: l,
                            value: group2Loc[l].unitCost
                        });

                       /* var indexOfID = groupedSRId.indexOf(group2Loc[l].id);
                        if(indexOfID < 0){
                            groupedSRId.push(group2Loc[l].id);
                        }*/
                    }
                    
                    var srId = srRec.save();

                    log.debug('srId',srId)
                //}
            }
        }

        var transferOrderSearchColInternalIdSL = search.createColumn({ name: 'internalid', summary: search.Summary.GROUP });

        var transferOrderSearchSetLink = search.create({
            type: 'transferorder',
            filters:  [
                ['type', 'anyof', 'TrnfrOrd'],
                'AND',
                ['mainline', 'is', 'F'],
                'AND',
                ['custbody_conso', 'is', 'F'],
                'AND',
                ['status', 'noneof', 'TrnfrOrd:H', 'TrnfrOrd:A'],
                'AND',
                ['formulanumeric: CASE WHEN {transactionlinetype}=\'Item\' then {line} else NULL end', 'isnotempty', ''],
                'AND',
                ['trandate', 'within', fiveDaysFromNowDate, elevenDaysFromNowDate],
            ],
            columns: [
                transferOrderSearchColInternalIdSL,
            ],
        });

        // // Note: Search.run() is limited to 4,000 results
        // transferOrderSearch.run().each((result: search.Result): boolean => {
        //     // ...
        //
        //     return true;
        // });
        var transferOrderSearchSetLinkPagedData = transferOrderSearchSetLink.runPaged({ pageSize: 1000 });
        for (var n = 0; n < transferOrderSearchSetLinkPagedData.pageRanges.length; n++) {
            var transferOrderSearchPageSetLink = transferOrderSearchSetLinkPagedData.fetch({ index: n });
            transferOrderSearchPageSetLink.data.forEach(function (result){
                var internalId = result.getValue(transferOrderSearchColInternalIdSL);
                
                var srcSR = record.submitFields({
                    type: record.Type.TRANSFER_ORDER,
                    id: internalId,
                    values: {
                        //orderstatus: 'H',
                        custbody_linktoconso_pr_sr: srId
                    }
                });

                log.debug('srcSR',srcSR)
            });
        }
        var baseURL = 'https://8154337.app.netsuite.com/app';
        var records = {transaction : srId}
        var body = 'A Stock Requisition has been made by a scheduled script, Stock Requisition Record Id: '+srId; 
        var recordLink = baseURL + '/accounting/transactions/trnfrord.nl?id=' + srId;

        email.send({
            author: 45,
            recipients: ['ellen@thrucloudsolutions.com'],
            subject: 'Stock Requisition has been Created',
            body: body + ' ' + recordLink,
           relatedRecords: records
        });
   }

    return {
        execute: execute
    };
    
});
