/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/ui/serverWidget', 'N/file', 'N/search'],
    /**
     * @param{record} record
     * @param{serverWidget} serverWidget
     */
    (record, serverWidget, file, search) => {
        const beforeLoad = (scriptContext) => {
            if (scriptContext.type == 'print') {
                let objEstimateRec = scriptContext.newRecord;
                let intEstimateId = objEstimateRec.id;
                log.debug("intEstimateId", intEstimateId)
                let form = scriptContext.form;
                let arrSublistItems = [];
                let lineCount = objEstimateRec.getLineCount('item');
                let sublistFieldNames = [
                    "custcol_adap_atlassian_cart_holder",
                    "custcol_adap_tech_name",
                    "custcol_adap_tech_email",
                    "custcol_adap_atl_cloudid",
                    "item",
                    "description",
                    "quantity",
                    "custcol_adap_atl_sen_number",
                    "custcol_product_start_date",
                    "custcol_product_end_date",
                    "custcol_adap_atl_import_url",
                    "quantity",
                    "rate",
                    "amount",
                    "custcol_adap_atl_item_disc_lines",
                    "custcol_adap_atl_item_disc_lines_prc",
                    "custcol_adap_atl_cart_item_inilstprc",
                    "custcol_adap_maintenance_period",
                    "custcol_adap_atl_item_disc_amount",
                    "taxrate1",
                    "taxrate2",
                    "tax1amt",
                    "line",
                ];
                let tax1 = 0
                let tax2 = 0
                let taxtotal = 0
                let taxrawtotal = 0
                let arrSenNumbers = [];
                let arrTechName = [];
                let arrTaxTotal = [];
                let counter = 0
                for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
                    const lineValues = {};
                    for (let sublistField of sublistFieldNames) {
                        lineValues[sublistField] = objEstimateRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: sublistField,
                            line: lineIndex
                        });
                    }
                    if (lineValues['custcol_adap_atl_cloudid']){
                        let objMasking = {
                            custcol_adap_atl_cloudid: lineValues['custcol_adap_atl_cloudid'],
                            custcol_adap_atl_sen_number: lineValues['custcol_adap_atl_sen_number'],
                            custcol_adap_atl_import_url: lineValues['custcol_adap_atl_import_url']
                        }
                        arrSenNumbers.push(objMasking);
                    }
                    if (lineValues['custcol_adap_tech_name']) {
                        let strTechName = lineValues['custcol_adap_tech_name'];
                        let strTechEmail = lineValues['custcol_adap_tech_email'];
                        let intATCardId = lineValues['custcol_adap_atlassian_cart_holder'];
                        
                        if (!arrTechName.some(tech => tech.name === strTechName)) {
                            let objTechDetails = {
                                aTCardId: intATCardId,
                                name: strTechName,
                                email: strTechEmail
                            }
                            arrTechName.push(objTechDetails);
                        }
                    }
                    
                    if (lineValues['custcol_adap_atl_cart_item_inilstprc']) {
                        counter = counter + 1
                        if (lineValues['custcol_product_start_date']) {
                            lineValues['custcol_product_start_date'] = formatDate(lineValues['custcol_product_start_date']);
                        }

                        if (lineValues['custcol_product_end_date']) {
                            lineValues['custcol_product_end_date'] = formatDate(lineValues['custcol_product_end_date']);
                        }
                        if (lineValues['taxrate1']) {
                            tax1 = lineValues['taxrate1'];
                            if (lineValues['taxrate2']) {
                                tax2 = lineValues['taxrate2']
                            }
                            taxrawtotal =  tax1 + tax2
                            taxtotal = taxtotal + taxrawtotal
                        }
                        arrSublistItems.push(lineValues);
                    }
                }
                let taxpercent = taxtotal / counter;
                let decimalPlaces = (taxrawtotal.toString().split('.')[1] || '').length;
                log.debug("taxrawtotal", taxrawtotal)
                log.debug("decimalPlaces", decimalPlaces)
                let formattedTaxPercent = parseFloat(taxpercent.toFixed(decimalPlaces)).toString();
                arrSublistItems.push({
                    taxtotal: formattedTaxPercent
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
                    let atCardId = techNameData.aTCardId;
                    let highestIndex = -1; // Initialize with a value less than the lowest index

                    arrSublistItems.forEach(function (data, index) {
                        let dataCardId = data.custcol_adap_atlassian_cart_holder;
                        if (atCardId == dataCardId) {
                            // Update the highest index if a higher index is found
                            highestIndex = Math.max(highestIndex, index);
                        }
                    });

                    // Push techNameData into arrSublistItems after the highest index
                    arrSublistItems.splice(highestIndex + 1, 0, techNameData);

                    // Update the highest index for this atCardId
                    highestIndexes[atCardId] = highestIndex + 1;
                });

                

                log.debug("arrSublistItems", arrSublistItems);    

                if (totalCharacters <= 100000){
                    let fldDataStorage = form.addField({
                        id: 'custpage_sorted_items',
                        type: serverWidget.FieldType.LONGTEXT,
                        label: 'Sorted Items'
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
