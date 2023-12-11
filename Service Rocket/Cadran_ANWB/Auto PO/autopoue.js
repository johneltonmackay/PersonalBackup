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
                    var ST_SCRIPT  = 'customscript_auto_create_po_mr';
                    let newRecord = scriptContext.newRecord
                    var intCreatedFrom = newRecord.getValue({
                        fieldId: 'createdfrom',
                    });
                    var strCreatedFrom = newRecord.getText({
                        fieldId: 'createdfrom',
                    });
                    var strShipStatus = newRecord.getValue({
                        fieldId: 'shipstatus',
                    });
                    log.debug("intCreatedFrom", intCreatedFrom)
                    if (intCreatedFrom){
                        if (strCreatedFrom.includes("Sales Order")) {
                            if (strShipStatus === "C"){
                                runMR(ST_SCRIPT);
                            }
                        }
                    }
                }
                
            } catch (err) {
                log.error('afterSubmit', err.message);
            }
        }


        // Private Function

        function getScriptDeployments(stScriptId) {
			var arrDeployments = [];
			var scriptdeploymentSearchObj = search.create({
				type: "scriptdeployment",
				filters: [
					["script.scriptid","startswith",stScriptId.toUpperCase()], "AND",
					["isdeployed","is","T"]
				],
				columns: [
					search.createColumn({ name: "scriptid" }),
					search.createColumn({ name: "scriptid", join: "script" })
				]
			});
			var searchResultCount = scriptdeploymentSearchObj.runPaged().count;
			if(searchResultCount != 0) {
				scriptdeploymentSearchObj.run().each(function(result){
					arrDeployments.push(result.getValue('scriptid'));
					return true;
				});
			}

			return arrDeployments;
		}

		function validateAvailabilityStatus(stScriptDeploymentId) {
			var isAvailable = true;
			var scheduledscriptinstanceSearchObj = search.create({
				type: "scheduledscriptinstance",
				filters: [
					["scriptdeployment.scriptid","startswith", stScriptDeploymentId], "AND",
					["status","anyof","PENDING","PROCESSING"]
				],
				columns: [
					search.createColumn({name: "status", label: "Status"}),
					search.createColumn({ name: "scriptid", join: "script", label: "Script ID" }),
					search.createColumn({ name: "scriptid", join: "scriptDeployment", label: "Custom ID" })
				]
			});
			var searchResultCount = scheduledscriptinstanceSearchObj.runPaged().count;
			if(searchResultCount != 0) {
				isAvailable = false;
			}

			return isAvailable;
		}

        const runMR = (stScript) => {
            var stLogTitle = "runMR";
			var arrDeployments = getScriptDeployments(stScript);
			var intNumberOfNonAvailableQueue = 0;
			var stDefaultDeploymentId = "customdeploy_auto_create_po_mr";

			try {
				for(var intIndex in arrDeployments) {
					if(validateAvailabilityStatus(arrDeployments[intIndex])) {
						//Run Map Reduce script
						var scriptTask = task.create({
							taskType: task.TaskType.MAP_REDUCE,
						});
						scriptTask.scriptId = stScript;
						scriptTask.deploymentId = arrDeployments[intIndex];

						var scriptTaskId = scriptTask.submit();
						log.debug(stLogTitle+':: deployment: '+arrDeployments[intIndex], 'scriptTaskId ='+scriptTaskId);
						break;
					} else { intNumberOfNonAvailableQueue += 1; }
				}

				/** Queue the request in the default deployment if all deployments are busy **/
				if(intNumberOfNonAvailableQueue != 0 && arrDeployments.length == intNumberOfNonAvailableQueue) {
					//Run Map Reduce script
					var scriptTask = task.create({
						taskType: task.TaskType.MAP_REDUCE,
                    });
					scriptTask.scriptId = stScript;
					scriptTask.deploymentId = stDefaultDeploymentId;

					var scriptTaskId = scriptTask.submit();
					log.debug(stLogTitle+':: deployment: '+arrDeployments[intIndex], 'scriptTaskId ='+scriptTaskId);
				}

			} catch (e) {
				log.error('Error','No inactive record found');
			}
        }
        
        return {afterSubmit}

    });