/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @author Pim Dieleman pdi@cadran.nl
 */
define(['N/record',
        'N/search',
        'N/task'],
    /**
    * @param {record} record
    * @param {search} search
    * @param {task} task
    */
    (record,search,task) => {
        var ST_SCRIPT  = 'customscript_anw_mr_generatepurchaseord';
        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            // log.debug('script','geraakt')
            let newRecord = scriptContext.newRecord
            // log.debug('status',newRecord.getValue('shipstatus'))
            //// log.debug('statusText',newRecord.getText('shipstatus'))
            // log.debug('statusRef',newRecord.getValue('statusRef'))
            if (newRecord.getValue('shipstatus') === "C" || newRecord.getValue('ordertype') === "VendAuth") {
                // log.debug('if','geraakt')
                /**
                 * Mark record as processing (not sure about this placement to be discussed)
                 */
                

                /**
                 * Define Map Reduce array of to be processed lines containing
                 * Article, Location, TransactionID, Transaction Type and Line Number
                 */
                var mrArray = []

                // Get transaction ID and type
                const transactionID = newRecord.id
                const transactionType = newRecord.type

                // Get line count of sublist item
                const linecount = newRecord.getLineCount({"sublistId":"item"})

                // Loop through sublist item lines to add them to the Map Reduce array
                for (let i = 0; i < linecount; i++) {
                    // log.debug('for','geraakt')  

                    // Get article
                    const article = newRecord.getSublistValue({"sublistId":"item","fieldId":"item","line":i})

                    // Get location
                    const location = newRecord.getSublistValue({"sublistId":"item","fieldId":"location","line":i})
					let department
					if (location) {
						var srchResults = search.lookupFields({type:"location",id:location,columns:"custrecord_anwb_location_department"})
						department = srchResults.custrecord_anwb_location_department[0].value
						log.debug('srchResults',srchResults.custrecord_anwb_location_department)
					}
                    if (newRecord.getSublistValue({"sublistId":"item","fieldId":"custcol_anwb_purchase_script","line":i})) {
                        //do nothing
						return
                    } else {
                        if (newRecord.getSublistValue({"sublistId":"item","fieldId":"itemreceive","line":i})) {
                            mrArray.push({
                                article,
                                location,
                                transactionID,
                                transactionType,
								department,
                                'lineNumber': i
                            })
                        }
                    }
                    // Push Article, Location, TransactionID, Transaction Type and Line Number to Map Reduce Array
                    
                }
                
                /**
                 * Call Map Reduce; ANW_MR_GeneratePurchaseOrder.js
                 * With parameter array of to be processed lines
                 */
                if (!(mrArray.length > 0)) {
                    // log.debug('No processing records')
                    return
                }
                
                // // log.debug('mrArray',mrArray)
                // var mrTask = task.create({
                //     taskType : task.TaskType.MAP_REDUCE,
                //     scriptId: 'customscript_anw_mr_generatepurchaseord',
                //     params: {
                //         custscript_anw_mr_generatepurchaseorder: JSON.stringify(mrArray)
                //     }
                // });

                // // Submit the task
                // mrTaskId = mrTask.submit();
                runMR(ST_SCRIPT, mrArray);
                
            }
            
        }
        function runMR(stScript, mrArray) {
			var stLogTitle = "runMR";
			var arrDeployments = getScriptDeployments(stScript);
			var intNumberOfNonAvailableQueue = 0;
			var stDefaultDeploymentId = "customdeploy_anw_mr_generatepurchaseord";

			try {
				for(var intIndex in arrDeployments) {
					if(validateAvailabilityStatus(arrDeployments[intIndex])) {
						//Run Map Reduce script
						var scriptTask = task.create({
							taskType: task.TaskType.MAP_REDUCE,
							params: {
								custscript_anw_mr_generatepurchaseorder: mrArray
							}
						});
						scriptTask.scriptId = stScript;
						scriptTask.deploymentId = arrDeployments[intIndex];

						var scriptTaskId = scriptTask.submit();
						// log.debug(stLogTitle+':: deployment: '+arrDeployments[intIndex], 'scriptTaskId ='+scriptTaskId);
						break;
					} else { intNumberOfNonAvailableQueue += 1; }
				}

				/** Queue the request in the default deployment if all deployments are busy **/
				if(intNumberOfNonAvailableQueue != 0 && arrDeployments.length == intNumberOfNonAvailableQueue) {
					//Run Map Reduce script
					var scriptTask = task.create({
						taskType: task.TaskType.MAP_REDUCE,
						params: {
                            custscript_anw_mr_generatepurchaseorder: mrArray
                        }});
					scriptTask.scriptId = stScript;
					scriptTask.deploymentId = stDefaultDeploymentId;

					var scriptTaskId = scriptTask.submit();
					// log.debug(stLogTitle+':: deployment: '+arrDeployments[intIndex], 'scriptTaskId ='+scriptTaskId);
				}

			} catch (e)
			{
				// var stDepId = createScriptDeployment(stScript, (new Date()).getTime());
				// var scriptTask = task.create({
				// 	taskType: task.TaskType.MAP_REDUCE,
				// 	params: {
				// 		custscript_wnz_request_id: id
				// 	}
				// });
				// scriptTask.scriptId = stScript;
				// scriptTask.deploymentId = stDepId;
				
				// var scriptTaskId = scriptTask.submit();	
				log.error('Error','No inactive record found');
			}
		};

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

		function createScriptDeployment(stScriptId, stTitle) {
			 var stLogTitle = "createScriptDeployment";
			
			 // // log.debug(stLogTitle, 'stScriptId ='+stScriptId + ' stTitle ='+stTitle);
			 
			  var objScriptDeployment = record.create({
	              type: 'scriptdeployment',
	              isDynamic: true,
	              defaultValues: {
	                  script: stScriptId,
	              }
	          });

	          objScriptDeployment.setValue({
	              fieldId: 'title',
	              value: stTitle
	          });

	          objScriptDeployment.setValue({
	              fieldId: 'isdeployed',
	              value: true
	          });

	          objScriptDeployment.setValue({
	              fieldId: 'status',
	              value: 'RELEASED'
	          });

	          objScriptDeployment.setValue({
	              fieldId: 'loglevel',
	              value: 'DEBUG'
	          });

	          objScriptDeployment.setValue({
	              fieldId: 'runasrole',
	              value: '3'
	          });

	          objScriptDeployment.setValue({
	              fieldId: 'isonline',
	              value: true
	          });

	          objScriptDeployment.setValue({
	              fieldId: 'allroles',
	              value: true
	          });

	          objScriptDeployment.setValue({
	              fieldId: 'allemployees',
	              value: true
	          });

	          var stScriptDeploymentId = objScriptDeployment.save({
	              enableSourcing: true,
	              ignoreMandatoryFields: true
	          });
	          
	          log.audit({
	              title: stLogTitle,
	              details: 'Successfully created script deployment with internal id = ' + stScriptDeploymentId
	          });
	          
		}

        return {afterSubmit}

    });
