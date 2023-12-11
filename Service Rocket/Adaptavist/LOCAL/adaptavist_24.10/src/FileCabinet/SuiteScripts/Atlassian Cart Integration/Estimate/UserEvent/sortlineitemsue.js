    /**
     * @NApiVersion 2.1
     * @NScriptType UserEventScript
     */
    define(['N/record', 'N/ui/serverWidget', '../../Library/FieldAndValueMapper/adap_field_and_def_value_mapper.js', 'N/search'],
        /**
         * @param{record} record
         * @param{serverWidget} serverWidget
         */
        (record, serverWidget, libMapper, search) => {
            const beforeLoad = (scriptContext) => {
                const STATIC_DATA = {
                    SUBLIST_ID: 'item',
                    SORTED_ITEM: 'Sorted Items',
                    PRINT: 'print'
                };
                
                if (scriptContext.type == STATIC_DATA.PRINT) {
                    let objEstimateRec = scriptContext.newRecord;
                    let intEstimateId = objEstimateRec.id;
                    log.debug("intEstimateId", intEstimateId)
                    let form = scriptContext.form;
                    let arrSublistItems = [];
                    let lineCount = objEstimateRec.getLineCount(STATIC_DATA.SUBLIST_ID);
                    let sublistFieldNames = [
                        libMapper.estimateFields.sublist.item.cartId.id,
                        libMapper.estimateFields.sublist.item.techName.id,
                        libMapper.estimateFields.sublist.item.techEmail.id,
                        libMapper.estimateFields.sublist.item.cloudId.id,
                        libMapper.estimateFields.sublist.item.itemId.id,
                        libMapper.estimateFields.sublist.item.description.id,
                        libMapper.estimateFields.sublist.item.quantity.id,
                        libMapper.estimateFields.sublist.item.senNumber.id,
                        libMapper.estimateFields.sublist.item.startDate.id,
                        libMapper.estimateFields.sublist.item.endDate.id,
                        libMapper.estimateFields.sublist.item.cloudSiteHostname.id,
                        libMapper.estimateFields.sublist.item.newListPrice_rate.id,
                        libMapper.estimateFields.sublist.item.customerPrice.id,
                        libMapper.estimateFields.sublist.item.customerDiscountAmount.id,
                        libMapper.estimateFields.sublist.item.customerDiscountRate.id,
                        libMapper.estimateFields.sublist.item.listPrice.id,
                        libMapper.estimateFields.sublist.item.maintenanceMonths.id,
                        libMapper.estimateFields.sublist.item.upgradeCredit.id,
                        libMapper.estimateFields.sublist.item.taxRate1.id,
                        libMapper.estimateFields.sublist.item.taxRate2.id,
                        libMapper.estimateFields.sublist.item.taxAmt1.id,
                        libMapper.estimateFields.sublist.item.line.id,
                        libMapper.estimateFields.sublist.item.taxCode.id,
                    ];
                    let taxAmountTotal
                    let tax1 = 0
                    let tax2 = 0
                    let amount = 0
                    let taxtotal = 0
                    let taxrawtotal = 0
                    let arrSenNumbers = [];
                    let arrTechName = [];
                    let arrTaxTotal = [];
                    let counter = 0
                    let taxResult
                    let arrTaxCode = searchTaxCode()
                    for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
                        const lineValues = {};
                        for (let sublistField of sublistFieldNames) {
                            if (sublistField === libMapper.estimateFields.sublist.item.taxCode.id) {
                                let intTaxCode = objEstimateRec.getSublistValue({
                                    sublistId: STATIC_DATA.SUBLIST_ID,
                                    fieldId: sublistField,
                                    line: lineIndex
                                });
                
                                // Iterate through the array of tax codes
                                arrTaxCode.forEach(function (taxdata){
                                    let taxId = taxdata.taxId
                                    let taxName = taxdata.taxName
                                    if (taxId == intTaxCode) {
                                        taxResult = taxName;
                                    }
                                });

                                // Set the value in lineValues[sublistField] to taxResult
                                log.debug('taxResult', taxResult)
                                lineValues[sublistField] = taxResult;
                            } else {
                                lineValues[sublistField] = objEstimateRec.getSublistValue({
                                    sublistId: STATIC_DATA.SUBLIST_ID,
                                    fieldId: sublistField,
                                    line: lineIndex
                                });
                            }
                            
                        }
                        if (lineValues[libMapper.estimateFields.sublist.item.cloudId.id]){
                            let objMasking = {
                                custcol_adap_atl_cloudid: lineValues[libMapper.estimateFields.sublist.item.cloudId.id],
                                custcol_adap_atl_sen_number: lineValues[libMapper.estimateFields.sublist.item.senNumber.id],
                                custcol_adap_atl_import_url: lineValues[libMapper.estimateFields.sublist.item.cloudSiteHostname.id]
                            }
                            arrSenNumbers.push(objMasking);
                        }
                        if (lineValues[libMapper.estimateFields.sublist.item.techName.id]) {
                            let strTechName = lineValues[libMapper.estimateFields.sublist.item.techName.id];
                            let strTechEmail = lineValues[libMapper.estimateFields.sublist.item.techEmail.id];
                            let intATCardId = lineValues[libMapper.estimateFields.sublist.item.cartId.id];
                            
                            if (!arrTechName.some(tech => tech.name === strTechName && tech.email === strTechEmail)) {
                                let objTechDetails = {
                                    aTCardId: intATCardId,
                                    name: strTechName,
                                    email: strTechEmail
                                };
                                arrTechName.push(objTechDetails);
                            }
                            
                        }
                    
                        if (lineValues[libMapper.estimateFields.sublist.item.listPrice.id]) {
                            amount = lineValues[libMapper.estimateFields.sublist.item.customerPrice.id]
                            counter = counter + 1
                            if (lineValues[libMapper.estimateFields.sublist.item.startDate.id]) {
                                lineValues[libMapper.estimateFields.sublist.item.startDate.id] = formatDate(lineValues[libMapper.estimateFields.sublist.item.startDate.id]);
                            }

                            if (lineValues[libMapper.estimateFields.sublist.item.endDate.id]) {
                                lineValues[libMapper.estimateFields.sublist.item.endDate.id] = formatDate(lineValues[libMapper.estimateFields.sublist.item.endDate.id]);
                            }
                            if (lineValues[libMapper.estimateFields.sublist.item.taxRate1.id]) {
                                tax1 = lineValues[libMapper.estimateFields.sublist.item.taxRate1.id];
                                if (lineValues[libMapper.estimateFields.sublist.item.taxRate2.id]) {
                                    tax2 = lineValues[libMapper.estimateFields.sublist.item.taxRate2.id]
                                }
                                taxrawtotal =  tax1 + tax2
                                taxtotal = taxtotal + taxrawtotal
                            } else {
                                taxrawtotal = 0
                            }
                            taxPercentTotal = taxrawtotal / 100
                            taxAmountTotal = amount * taxPercentTotal
                            log.debug("taxAmountTotal", amount)
                            var objTaxRaw = {
                                taxrawtotal: taxrawtotal,
                                totalcount: 1,  // Initialize totalcount to 1
                                taxAmountTotal: taxAmountTotal
                            }
                        
                            // Check if taxrawtotal is not already in arrTaxTotal
                            let existingObj = arrTaxTotal.find(obj => obj.taxrawtotal === objTaxRaw.taxrawtotal);
                            if (!existingObj) {
                                arrTaxTotal.push(objTaxRaw);
                            } else {
                                // If it exists, increment the totalcount and sum the taxAmountTotal
                                existingObj.totalcount++;
                                existingObj.taxAmountTotal += objTaxRaw.taxAmountTotal;
                            }

                            
                            arrSublistItems.push(lineValues);
                        }
                    }
                    arrTaxTotal.forEach(function (rawTax){
                        let taxValue = rawTax.taxrawtotal
                        let taxCount = rawTax.totalcount
                        let taxTotal = taxValue * taxCount

                        let taxpercent = taxTotal / taxCount
                        let decimalPlaces = (taxValue.toString().split('.')[1] || '').length;
                        log.debug("taxValue", taxValue)
                        log.debug("decimalPlaces", decimalPlaces)
                        let formattedTaxPercent = parseFloat(taxpercent.toFixed(decimalPlaces)).toString();
                        arrSublistItems.push({
                            taxtotal: formattedTaxPercent,
                            taxamount: rawTax.taxAmountTotal,
                            totalcount: rawTax.totalcount
                        });
                    });
                    
                    arrSenNumbers.forEach(function (cloud){
                        let cloudUrl = cloud.custcol_adap_atl_import_url
                        let cloudSEN = cloud.custcol_adap_atl_sen_number
                        arrSublistItems.forEach(function (data) {
                            let dataUrl = data.custcol_adap_atl_import_url
                            if (cloudUrl == dataUrl){
                                log.debug("cloudSEN", cloudSEN)
                                data.custcol_adap_atl_sen_number = cloudSEN;
                            }
                        })
                    })
                    arrSublistItems.sort(customSort);
                    
                    let jsonString = JSON.stringify(arrSublistItems);
                    let totalCharacters = jsonString.length;  

                    log.debug("arrTaxTotal", arrTaxTotal);
                    log.debug("Total characters in arrSublistItems:", totalCharacters);
                    log.debug("arrSublistItems.length", arrSublistItems.length);
                    log.debug("arrSenNumber", arrSenNumbers);
                    log.debug("arrTechName", arrTechName);

                    // Create an object to store the highest index for each atCardId
                    const highestIndexes = {};

                    arrTechName.forEach(function (techNameData) {
                        let techEmail = techNameData.email;
                        let highestIndex = -1; // Initialize with a value less than the lowest index

                        arrSublistItems.forEach(function (data, index) {
                            let dataEmail = data.custcol_adap_tech_email;
                            if (techEmail == dataEmail) {
                                // Update the highest index if a higher index is found
                                highestIndex = Math.max(highestIndex, index);
                            }
                        });

                        // Push techNameData into arrSublistItems after the highest index
                        arrSublistItems.splice(highestIndex + 1, 0, techNameData);

                        // Update the highest index for this atCardId
                        highestIndexes[techEmail] = highestIndex + 1;
                    });
                    arrSublistItems.forEach(function (data, index) {
                        log.debug("arrSublistItems data " + index, data);
                    });

                    if (totalCharacters <= 100000){
                        let fldDataStorage = form.addField({
                            id: libMapper.estimateFields.sublist.item.sortedItems.id,
                            type: serverWidget.FieldType.LONGTEXT,
                            label: STATIC_DATA.SORTED_ITEM
                        });
                        fldDataStorage.defaultValue = JSON.stringify(arrSublistItems);
                        fldDataStorage.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    } else {
                        record.submitFields({
                            type: record.Type.ESTIMATE,
                            id: intEstimateId,
                            values: {
                                custbody_adap_print_object: JSON.stringify(arrSublistItems)
                            }
                        })
                    }
                    
                }
            }
            function searchTaxCode() {
                let arrTaxCodes = [];
                try {
                    let objTaxCodeSearch = search.create({
                        type: 'salestaxitem',
                        filters: [
                            ['isinactive', 'is', 'F'],
                          ],
                        columns: [
                            search.createColumn({name: 'internalid'}),
                            search.createColumn({name: 'name'}),
                        ],
    
                    });
                    var searchResultCount = objTaxCodeSearch.runPaged().count;
                    if (searchResultCount != 0) {
                        var pagedData = objTaxCodeSearch.runPaged({pageSize: 1000});
                        for (var i = 0; i < pagedData.pageRanges.length; i++) {
                            var currentPage = pagedData.fetch(i);
                            var pageData = currentPage.data;
                            if (pageData.length > 0) {
                                for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                                    arrTaxCodes.push({
                                        taxId: pageData[pageResultIndex].getValue({name: 'internalid'}),
                                        taxName: pageData[pageResultIndex].getValue({name: 'name'}),
                                    });
                                }
                            }
                        }
                    }
                    log.debug("searchTaxCode: arrTaxCodes", arrTaxCodes)
                    return arrTaxCodes;
                } catch (err) {
                    log.error('searchTaxCode', err.message);
                }
            }
        
            function formatDate(dateString) {
                if (dateString) {
                    const date = new Date(dateString);
                    const monthNamesShort = [
                        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                    ];
                    return `${monthNamesShort[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
                }
                return null;
            }
            function customSort(a, b) {
                // First, sort items with no site URL
                if (!a.custcol_adap_atl_import_url && b.custcol_adap_atl_import_url) {
                    return -1;
                } else if (a.custcol_adap_atl_import_url && !b.custcol_adap_atl_import_url) {
                    return 1;
                }

                // Then, sort by site URL - highest to lowest amount
                if (a.custcol_adap_atl_import_url && b.custcol_adap_atl_import_url) {
                    // Compare site URLs
                    const siteUrlComparison = a.custcol_adap_atl_import_url.localeCompare(b.custcol_adap_atl_import_url);

                    // If site URLs are the same, sort by amount
                    if (siteUrlComparison === 0) {
                        return b.amount - a.amount;
                    }

                    return siteUrlComparison;
                }

                // Finally, sort 0 priced items
                if (a.amount === 0 && b.amount !== 0) {
                    return -1;
                } else if (a.amount !== 0 && b.amount === 0) {
                    return 1;
                }

                return 0; // If all sorting criteria are the same
            }
            return { beforeLoad };
        });
