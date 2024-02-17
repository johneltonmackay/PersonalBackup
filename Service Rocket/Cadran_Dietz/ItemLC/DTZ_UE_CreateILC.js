/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'],
    
    (record, search) => {
        const afterSubmit = (scriptContext) => {
            log.debug("CONTEXT: ", scriptContext.type);
            const STATIC_DATA = {
                SUBLIST_ID: 'addressbook',
                ITEM_NAME: 'itemid',
                ITEM_ID: 'internalid',
                ITEM_SUBSIDIARY: 'subsidiary',
                ITEM_ISWIP: 'iswip',
                ILC_NAME: 'name',
                ILC_ITEM: 'item',
                ILC_LOCATION: 'location',
            };
            try {
                let newRecord = scriptContext.newRecord;
                let recType = newRecord.type
                let strId = newRecord.id
                let objRecord = record.load({
                        type: recType,
                        id: strId,
                        isDynamic: true,
                    });
                log.debug("objRecord", objRecord)
                if (objRecord){
                    let strItemName = objRecord.getValue({
                        fieldId: STATIC_DATA.ITEM_NAME
                    })
                    let intItemiD = objRecord.getValue({
                        fieldId: STATIC_DATA.ITEM_ID
                    })
                    let arrSubsidiary = objRecord.getText({
                        fieldId: STATIC_DATA.ITEM_SUBSIDIARY
                    })
                    log.debug("intItemiD", intItemiD)
                    log.debug("strItemName", strItemName)
                    log.debug("arrSubsidiary", arrSubsidiary)

                    let arrLocation = searchLocations()
                    let arrSubsidiaryResults = searchSubsidiary()

                    if (strItemName && arrSubsidiary){
                        arrLocation.forEach(location => {
                            let intLocationSubsidiary = location.subsidiary
                            let intLocationId = location.locationid
                            arrSubsidiary.forEach(subsidiary => {
                                let objSubsidiaryData = getSubsidiary(subsidiary, arrSubsidiaryResults)
                                if (intLocationSubsidiary == objSubsidiaryData.namenohierarchy){
                                    var recILCObj = record.create({
                                        type: record.Type.ITEM_LOCATION_CONFIGURATION,
                                        isDynamic: true
                                    });
                                    recILCObj.setValue({
                                        fieldId: STATIC_DATA.ILC_NAME,
                                        value: intItemiD
                                    });
                                    recILCObj.setValue({
                                        fieldId: STATIC_DATA.ILC_ITEM,
                                        value: intItemiD
                                    });
                                    recILCObj.setValue({
                                        fieldId: STATIC_DATA.ITEM_SUBSIDIARY,
                                        value: objSubsidiaryData.intSubsidiary
                                    });  
                                    recILCObj.setValue({
                                        fieldId: STATIC_DATA.ILC_LOCATION,
                                        value: intLocationId
                                    }); 
                                    recILCObj.setValue({
                                        fieldId: STATIC_DATA.ITEM_ISWIP,
                                        value: true
                                    }); 
                                    recILCId = recILCObj.save({
                                        enableSourcing: true,
                                        ignoreMandatoryFields: true
                                    });
                                    log.audit('TLC CREATED', 'RECORD ID: ' + recILCId);   
                                }
                            });
                        });
                    }
                }
            } catch (err) {
                log.error('afterSubmit', err.message);
            }
        }

        const getSubsidiary = (subsidiary, arrSubsidiaryResults) => {
            let objSubsidiaryData = {}
            if (arrSubsidiaryResults.length > 0 && arrSubsidiaryResults){
                arrSubsidiaryResults.forEach(data => {
                    let strSubsidiary = data.name
                    if (subsidiary == strSubsidiary){
                        objSubsidiaryData = {
                            intSubsidiary: data.internalid,
                            namenohierarchy: data.namenohierarchy,
                        }
                    }
                });
            }
            log.debug("getSubsidiary: objSubsidiaryData", objSubsidiaryData)
            return objSubsidiaryData
        }

        const searchLocations = () => {
			let arrLocation = [];
			try {
				let objUnitTypeSearch = search.create({
					type: 'location',
					filters: [],
					columns: [
						search.createColumn({ name: 'internalid' }),
						search.createColumn({ name: 'name' }),
						search.createColumn({ name: 'subsidiary' }),
					],

				});
				var searchResultCount = objUnitTypeSearch.runPaged().count;
				if (searchResultCount != 0) {
					var pagedData = objUnitTypeSearch.runPaged({pageSize: 1000});
					for (var i = 0; i < pagedData.pageRanges.length; i++) {
						var currentPage = pagedData.fetch(i);
						var pageData = currentPage.data;
						if (pageData.length > 0) {
							for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
								arrLocation.push({
									locationid: pageData[pageResultIndex].getValue({name: 'internalid'}),
									name: pageData[pageResultIndex].getValue({name: 'name'}),
									subsidiary: pageData[pageResultIndex].getValue({name: 'subsidiary'}),
								});
							}
						}
					}
				}
				log.debug("searchLocations: arrLocation", arrLocation)
				return arrLocation;
			} catch (err) {
				log.error('searchRecord', err.message);
			}
		}

        const searchSubsidiary = () => {
			let arrSubsidiary = [];
			try {
				let objUnitTypeSearch = search.create({
					type: 'subsidiary',
					filters: [],
					columns: [
						search.createColumn({ name: 'internalid' }),
						search.createColumn({ name: 'namenohierarchy' }),
                        search.createColumn({ name: 'name' }),
					],

				});
				var searchResultCount = objUnitTypeSearch.runPaged().count;
				if (searchResultCount != 0) {
					var pagedData = objUnitTypeSearch.runPaged({pageSize: 1000});
					for (var i = 0; i < pagedData.pageRanges.length; i++) {
						var currentPage = pagedData.fetch(i);
						var pageData = currentPage.data;
						if (pageData.length > 0) {
							for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
								arrSubsidiary.push({
									internalid: pageData[pageResultIndex].getValue({name: 'internalid'}),
									namenohierarchy: pageData[pageResultIndex].getValue({name: 'namenohierarchy'}),
                                    name: pageData[pageResultIndex].getValue({name: 'name'}),
								});
							}
						}
					}
				}
				log.debug("searchSubsidiary: arrSubsidiary", arrSubsidiary)
				return arrSubsidiary;
			} catch (err) {
				log.error('searchRecord', err.message);
			}
		}

        return {afterSubmit}

    });