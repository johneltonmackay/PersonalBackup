/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/task'],
    
    (record, search, task) => {
        const afterSubmit = (scriptContext) => {
            log.debug("CONTEXT: ", scriptContext.type);
            try {
                if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.EDIT) {
                    let newRecord = scriptContext.newRecord
					let recId = newRecord.id
                    var strUnitId = newRecord.getText({
                        fieldId: 'custrecord_rfs_multiupc_unit',
                    });
					var intItemId = newRecord.getValue({
						fieldId: 'custrecord_rfs_multiupc_item',
					})
                    log.debug("strUnitId", strUnitId)
					log.debug("intItemId", intItemId)
					if (strUnitId && intItemId){
						fieldLookUp = search.lookupFields({
							type: search.Type.ITEM,
							id: intItemId,
							columns: 'itemid'
						});
						log.debug("fieldLookUp",fieldLookUp)
						if (fieldLookUp){
							resItemId = fieldLookUp.itemid;
							log.debug("resItemId", resItemId)
							let arrUnitTypes = searchUnitType(strUnitId)
							arrUnitTypes.forEach(unitData => {
								let strName = unitData.name
								let strUnitName = unitData.unitName
								if (strUnitId == strUnitName && strName == resItemId){
									log.debug('afterSubmit baseUnit', unitData.baseUnit)
									log.debug('afterSubmit rate', unitData.rate)
									record.submitFields({
										type: 'customrecord_rfs_multiupc',
										id: recId,
										values: {
											custrecord_is_base_unit: unitData.baseUnit,
											custrecord_rate: unitData.rate ? parseFloat(unitData.rate) : null,
										}
									});
									log.debug('afterSubmit updated recId ', recId)
								}
							});		
						}
					}
                }
                
            } catch (err) {
                log.error('afterSubmit', err.message);
            }
        }


        // Private Function

        const searchUnitType= (strUnitId) => {
			let arrUnitTypes = [];
			try {
				let objUnitTypeSearch = search.create({
					type: 'unitstype',
					filters: [
						['unitname', 'is', strUnitId],
					],
					columns: [
						search.createColumn({ name: 'internalid' }),
						search.createColumn({ name: 'unitname' }),
						search.createColumn({ name: 'baseunit' }),
						search.createColumn({ name: 'conversionrate' }),
						search.createColumn({ name: 'name' }),
						search.createColumn({ name: 'pluralname' }),
						search.createColumn({ name: 'pluralabbreviation' }),
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
								arrUnitTypes.push({
									unitTypeId: pageData[pageResultIndex].getValue({name: 'internalid'}),
									unitName: pageData[pageResultIndex].getValue({name: 'unitname'}),
									baseUnit: pageData[pageResultIndex].getValue({name: 'baseunit'}),
									rate: pageData[pageResultIndex].getValue({name: 'conversionrate'}),
									name: pageData[pageResultIndex].getValue({name: 'name'}),
									pluralName: pageData[pageResultIndex].getValue({name: 'pluralname'}),
									pluralAbb: pageData[pageResultIndex].getValue({name: 'pluralabbreviation'}),
								});
							}
						}
					}
				}
				log.debug("getInputData: arrUnitTypes", arrUnitTypes)
				return arrUnitTypes;
			} catch (err) {
				log.error('searchRecord', err.message);
			}
		}
        
        return {afterSubmit}

    });