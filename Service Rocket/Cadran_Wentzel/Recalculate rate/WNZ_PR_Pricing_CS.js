/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       21 Feb 2019     mj
 *
 */

/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search', 'N/currentRecord', 'N/format', 'N/ui/dialog', 'N/ui', './WNZ_PR_Library.js'],
	/**
	 * @param {record}
	 * record
	 */
	function(record, search, currentRec, format, dialog, ui, lib)
	{

		var isConfirm = false;
		var thisResult = false;
		var SEARCH_PRICING_DISCOUNT = 'customsearch_wnz_ocp_pricing_discount_pr';

		function computeTotalDiscount(currentRecord){

			var stLDType = currentRecord.getCurrentSublistValue({
				sublistId: 'item',
				fieldId: 'custcol_wnz_ocp_ld_type'
			});

			// alert(stLDType);

			debugger;

			var flTotal = 0;

			if(stLDType == '1') //% Type
			{
				var flRate = parseFloat(currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'rate'
				})) || 0;

				var flPriceFactor = parseFloat(currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'custcol_wnz_price_factor_pr'
				})) || 0;

				var flBase = parseFloat(currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'custcol_wnz_ocp_base_price'
				})) || 0;

				flTotal = (1 - (flRate/(flBase/flPriceFactor))) * 100;

				currentRecord.setCurrentSublistValue('item', 'custcol_wnz_total_discount', flTotal);


			}
			else
			{
				var flLineDiscount = parseFloat(currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'custcol_wnz_ocp_ld'
				})) || 0;

				var flPromoDiscount = parseFloat(currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'custcol_wnz_ocp_promotion_discount'
				})) || 0;

				var flBasketDiscount = parseFloat(currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'custcol_wnz_ocp_basket_discount'
				})) || 0;

				flTotal = flLineDiscount + flPromoDiscount + flBasketDiscount;

				currentRecord.setCurrentSublistValue('item', 'custcol_wnz_total_discount', flTotal);

			}
		}

		function WNZ_PageInit_Control(context)
		{
			var curRec = currentRec.get();

			debugger;

			if (context.mode == 'copy')
			{
				var intDetailLine = curRec.getLineCount('item');

				for (var i = 0; i < intDetailLine; i++) {

					curRec.selectLine({
						sublistId: 'item',
						line: i
					});

					curRec.setCurrentSublistValue({
						sublistId: 'item',
						fieldId: lib.TRANS_LINE_FLDS.CONTRACT_REF_KEY,
						value: ''
					});

					curRec.setCurrentSublistValue({
						sublistId: 'item',
						fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
						value: ''
					});

					curRec.commitLine({
						sublistId:  'item'
					});
				}
			}

		}

		function WNZ_LineInit_Pricing(context)
		{
			debugger;

			var currentRecord = context.currentRecord;
			var sublistName = context.sublistId;
			var recordType = currentRecord.type;

			var lineCt = currentRecord.getLineCount('item');

			// if Contract is NETT, disable Line and Promotion Discounts
			if (sublistName == 'item') {

				var currLine = currentRecord.getCurrentSublistIndex('item');

				//WNZ-172
				var stGrossNetInd = currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: lib.TRANS_LINE_FLDS.GROSS_NETT_IND
				});

				if (lineCt > 0 && currLine < lineCt && stGrossNetInd != lib.GROSSNET.NETT) { // if current line is less than line count, continue with the script
					//End WNX-172

					var stGrossNet = currentRecord.getCurrentSublistValue({
						sublistId: 'item',
						fieldId: lib.TRANS_LINE_FLDS.GROSS_NETT_IND
					});

					var objLDFld = currentRecord.getSublistField({
						sublistId: 'item',
						fieldId: lib.TRANS_LINE_FLDS.FLD_LINE_DISC,
						line: currLine
					});

					var isDisabled = false;

					switch (stGrossNet) {

						case lib.GROSSNET.NETT:
							currentRecord.setCurrentSublistValue({
								sublistId: 'item',
								fieldId: lib.TRANS_LINE_FLDS.FLD_LINE_DISC,
								value: 0,
								ignoreFieldChange: true
							});

							isDisabled = true;
							break;

						case lib.GROSSNET.GROSS:
							isDisabled = false;
							break;

					}

					if (objLDFld) {
						objLDFld.isDisabled = isDisabled; // disable or enable line discount field
					}
				}
			}
		}

		function WNZ_PostSourcing_Pricing(context) {

			var currentRecord = context.currentRecord;
			var fldName = context.fieldId;
			var sublistName = context.sublistId;
			var recordType = currentRecord.type;

			if (sublistName == 'item' && fldName == 'item')
			{
				debugger;

				//WNZ 922
				var intQtyPackaging = currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'custcol_wnz_qty_pref_packaging'
				});
				if(intQtyPackaging){
					currentRecord.setCurrentSublistValue({
						sublistId: 'item',
						fieldId: 'quantity',
						value: intQtyPackaging,
						ignoreFieldChange: true
					});
				}
				//END WNZ 922

				//WNZ-685
				var stItemInternalId = currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'item'
				});
				var stVendorInternalId = currentRecord.getValue('entity');

				var stValidBdate = checkMVF(stItemInternalId, stVendorInternalId);
				if(stValidBdate)
				{
					currentRecord.setCurrentSublistValue({
						sublistId: 'item',
						fieldId: 'rate',
						value: ''
					});
				}

				//end WNZ-685


				//end WNZ-685

				//WNZ-565
				var isConsignment = currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'custcol_wnz_is_consignment'
				});

				if(isConsignment)
				{
					setConsignmentAmt(currentRecord);
				}

				checkDiscount(currentRecord);

				//WNZ-172
				var stGrossNetInd = currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: lib.TRANS_LINE_FLDS.GROSS_NETT_IND
				});

				if(lib.GROSSNET.NETT == stGrossNetInd)
				{
					resetDiscountLines(currentRecord);
				}
				computeTotalDiscount(currentRecord);
			}
		}

		function WNZ_ValidateLine_Pricing(context) {

			debugger;
			var currentRecord = context.currentRecord;
			var fldName = context.fieldId;
			var sublistName = context.sublistId;
			var recordType = currentRecord.type;

			if (sublistName == 'item')
			{
				//WNZ-172
				var stGrossNetInd = currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: lib.TRANS_LINE_FLDS.GROSS_NETT_IND
				});

				if(lib.GROSSNET.NETT == stGrossNetInd)
				{
					//calculate the new balance per Contracts
					calContracts(currentRecord);

					var flBasePrice = currentRecord.getCurrentSublistValue({
						sublistId: sublistName,
						fieldId: lib.TRANS_LINE_FLDS.BASE_PRICE
					});

					var intQty = currentRecord.getCurrentSublistValue({
						sublistId: 'item',
						fieldId: 'quantity'
					});

					var stPriceFactor = currentRecord.getCurrentSublistText({
						sublistId: sublistName,
						fieldId: lib.TRANS_LINE_FLDS.FLD_PRICE_FACTOR
					});

					var intMaterialGroup = currentRecord.getCurrentSublistValue({
						sublistId: "item",
						fieldId: 'custcol_wnz_main_group_code',
					});

					if (stPriceFactor == "" || stPriceFactor == null) {
						stPriceFactor = "1";
					}
					var flPriceFactor = parseFloat(stPriceFactor.replace(',', '.'));
					console.log("recordType", recordType)
					console.log("stPriceFactor", stPriceFactor)
					console.log("flPriceFactor", flPriceFactor)
					if (recordType == 'purchaseorder'){
						if (intMaterialGroup == 63) {
							var unitPrice = flBasePrice * flPriceFactor;
							console.log("MAT unitPrice", unitPrice)
						} else {
							var unitPrice = flBasePrice / flPriceFactor;
							console.log("NOT MAT unitPrice", unitPrice)
						}
					} else {
						var unitPrice = flBasePrice / flPriceFactor;
					}
					

					var finalAmount = (unitPrice * intQty).toFixed(3);


					// Set the Discounted Rate to the "Wentzel Rate" field
					currentRecord.setCurrentSublistValue('item', lib.TRANS_LINE_FLDS.FLD_WENTZEL_RATE, flBasePrice);
					currentRecord.setCurrentSublistValue('item', "rate", unitPrice);
					currentRecord.setCurrentSublistValue('item', "amount", finalAmount);

					//Start 05/01/2019
					resetDiscountLines(currentRecord);
					computeTotalDiscount(currentRecord);
					//End 05/01/2019

					return true;
				}
				//End WNZ-172

				var flBasePrice = currentRecord.getCurrentSublistValue({
					sublistId: sublistName,
					fieldId: lib.TRANS_LINE_FLDS.BASE_PRICE
				});

				var flLineDisc = currentRecord.getCurrentSublistValue({
					sublistId: sublistName,
					fieldId: lib.TRANS_LINE_FLDS.FLD_LINE_DISC
				});

				var isSetRate = false;
				var discountedPrice = flBasePrice;
				var lineDiscounted = flBasePrice;

				if (parseInt(flBasePrice) == 0) {
					discountedPrice = 0;
					isSetRate = true;
				}

				if (lib.convNull(flBasePrice) != '' && flBasePrice > 0)
				{
					if (lib.convNull(flLineDisc) == '') {
						flLineDisc = 0;
					}

					var stLineDiscType = currentRecord.getCurrentSublistValue({
						sublistId: sublistName,
						fieldId: lib.TRANS_LINE_FLDS.FLD_LD_TYPE
					});

					if (stLineDiscType == lib.DISCOUNT_TYPE.PERCENT)
					{
						lineDiscounted = (flBasePrice - (flBasePrice * (flLineDisc / 100)));
					}

					if (stLineDiscType == lib.DISCOUNT_TYPE.FIXED_RATE || stLineDiscType == lib.DISCOUNT_TYPE.FIXED_RATE_EU )
					{
						lineDiscounted = (flBasePrice - flLineDisc);
					}

					discountedPrice = parseFloat(toFixed(lineDiscounted, 5));

					isSetRate = true;

				}

				if (isSetRate)
				{

					//Set the value for Curnet ld, pd, and bt columns
					currentRecord.setCurrentSublistValue({
						sublistId: sublistName,
						fieldId: lib.TRANS_LINE_FLDS.FLD_CURNET_LD,
						value: lineDiscounted,
						ignoreFieldChange: true
					});


					// Set the Discounted Rate to the "Wentzel Rate" field
					currentRecord.setCurrentSublistValue({
						sublistId: sublistName,
						fieldId: lib.TRANS_LINE_FLDS.FLD_WENTZEL_RATE,
						value: discountedPrice,
						ignoreFieldChange: true
					});

					var intMaterialGroup = currentRecord.getCurrentSublistValue({
						sublistId: "item",
						fieldId: 'custcol_wnz_main_group_code',
					});

					var stPriceFactor = currentRecord.getCurrentSublistText({
						sublistId: sublistName,
						fieldId: lib.TRANS_LINE_FLDS.FLD_PRICE_FACTOR
					});
					if (stPriceFactor == "" || stPriceFactor == null) {
						stPriceFactor = "1";
					}

					var flPriceFactor = parseFloat(stPriceFactor.replace(',', '.'));

					if (recordType == 'purchaseorder'){
						if (intMaterialGroup == 63) {
							var unitPrice = discountedPrice * flPriceFactor;
							console.log("MAT unitPrice", unitPrice)
						} else {
							var unitPrice = discountedPrice / flPriceFactor;
							console.log("NOT MAT unitPrice", unitPrice)
						}
					} else {
						var unitPrice = discountedPrice / flPriceFactor;
						console.log('flPriceFactor', flPriceFactor)
						console.log('discountedPrice', discountedPrice)
						console.log('unitPrice', unitPrice)
					}

					currentRecord.setCurrentSublistValue({
						sublistId: sublistName,
						fieldId: 'rate',
						value: unitPrice,
						ignoreFieldChange: true
					});
				}

				//calculate the new balance per Contracts
				calContracts(currentRecord);

				var stRate = currentRecord.getCurrentSublistText({
					sublistId: sublistName,
					fieldId: 'rate'
				});

				if(!stRate) stRate = 0;

				var flRate = format.parse({value: stRate, type: format.Type.CURRENCY});


				// Set the Final Amount
				// Deduct the Balance from the Contract
				var intQty = currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'quantity'
				});

				var finalAmount = (flRate * intQty).toFixed(3);

				currentRecord.setCurrentSublistValue('item', "amount", finalAmount);
				computeTotalDiscount(currentRecord);
			}

			return true;
		}

		function WNZ_ValidateDelete_Pricing(context) {

			var currentRecord = context.currentRecord;
			var fldName = context.fieldId;
			var sublistName = context.sublistId;
			var recordType = currentRecord.type;
			var jsonLine = {};
			var jsonValue = currentRecord.getValue(lib.TRANS_BODY_FLDS.JSON_LINE);

			if(lib.convNull(jsonValue) != '') {
				if (JSON.stringify(jsonValue) != '{}') jsonLine = JSON.parse(jsonValue);
			}

			if (sublistName == 'item')
			{
				var currLine = currentRecord.getCurrentSublistIndex('item');

				var currQty = currentRecord.getCurrentSublistValue({
					sublistId: sublistName,
					fieldId: 'quantity'
				});

				var prevQty = currentRecord.getCurrentSublistValue({
					sublistId: sublistName,
					fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY
				});

				//getting the unit
				var ivUnit = currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_UNIT,
				});

				if(ivUnit == lib.UNIT.KG)
				{
					currQty = currentRecord.getCurrentSublistValue({
						sublistId: sublistName,
						fieldId: lib.TRANS_LINE_FLDS.TOTAL_WEIGHT_BASE
					});

				}

				var itemVolContract = currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_CONTRACT,
					line: currLine
				});

				var contractId = currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: lib.TRANS_LINE_FLDS.CONTRACT_REF_KEY,
					line: currLine
				});

				//validate the json field
				if (JSON.stringify(jsonLine) != '{}') {
					if (jsonLine[contractId]) {
						var jsonQty = jsonLine[contractId].balanceQty;

						if (jsonLine[contractId].newBalanceQty == null)
						{
							jsonLine[contractId] = {
								'balanceQty': jsonQty,
								'newBalanceQty': parseFloat(jsonQty) + parseFloat(currQty),
								'hdr' : jsonLine[contractId].hdr
							}
						}
						else if(!prevQty && jsonLine[contractId] && jsonLine[contractId].newBalanceQty)
						{
							jsonLine[contractId] = {
								'balanceQty': jsonQty,
								'newBalanceQty': parseFloat(jsonLine[contractId].newBalanceQty) + parseFloat(currQty),
								'hdr' : jsonLine[contractId].hdr
							}
						}
						else
						{
							jsonLine[contractId] = {
								'balanceQty': jsonQty,
								'newBalanceQty': parseFloat(jsonLine[contractId].newBalanceQty) + parseFloat(currQty),
								'hdr' : jsonLine[contractId].hdr
							}
						}

						//update balance of the rest of contract line with same header
						if(jsonLine[contractId].hdr)
						{
							for (var intCtrJson in jsonLine)
							{
								if(jsonLine[intCtrJson].hdr == jsonLine[contractId].hdr)
								{
									jsonLine[intCtrJson].newBalanceQty = jsonLine[contractId].newBalanceQty;
								}
							}
						}


					}

					currentRecord.setValue(lib.TRANS_BODY_FLDS.JSON_LINE, JSON.stringify(jsonLine));
				}

			}

			return true;

		}

		function WNZ_FieldChanged_Pricing(context) {

			//debugger;

			var currentRecord = context.currentRecord;
			var fldName = context.fieldId;
			var sublistName = context.sublistId;
			var recordType = currentRecord.type;

			var currLine = currentRecord.getCurrentSublistIndex('item');

			if(fldName == 'rate' || fldName == 'custcol_wnz_price_factor' || fldName == 'custcol_wnz_ocp_base_price' || fldName == 'custcol_wnz_ocp_ld_type'  || fldName ==  'custcol_wnz_ocp_ld' || fldName ==  'custcol_wnz_ocp_promotion_discount' || fldName == 'custcol_wnz_ocp_basket_discount'){
				computeTotalDiscount(currentRecord);
			}


			if ('item' == sublistName && fldName == lib.TRANS_LINE_FLDS.GROSS_NETT_IND) {

				var stGrossNet = currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: lib.TRANS_LINE_FLDS.GROSS_NETT_IND,
					line: currLine
				});
			}

			if ('item' == sublistName && fldName == 'quantity') {
				checkDiscount(currentRecord);

				//WNZ-172
				var stGrossNetInd = currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: lib.TRANS_LINE_FLDS.GROSS_NETT_IND
				});

				if(lib.GROSSNET.NETT == stGrossNetInd)
				{
					resetDiscountLines(currentRecord);
				}
				computeTotalDiscount(currentRecord);
			}
		}

		function WNZ_SaveRecord_Pricing(context)
		{
			debugger;

			var currentRecord = context.currentRecord;
			var sublistName = context.sublistId;


			var arrErrorItems = [];
			//PO: IF WNZ Consignment = TRUE THEN Set Base Price, Rate & Amount to 0 WNZ-565
			var intExLen = currentRecord.getLineCount('item');
			for(var i =0 ;  i < intExLen; i++)
			{
				var isConsignment = currentRecord.getSublistValue('item', 'custcol_wnz_is_consignment', i);
				var intAmt = currentRecord.getSublistValue('item', 'amount', i);
				var intBasePrice = currentRecord.getSublistValue('item', 'custcol_wnz_ocp_base_price', i);
				var intBaseRate = currentRecord.getSublistValue('item', 'custcol_wnz_wentzel_rate', i);
				var intRate = currentRecord.getSublistValue('item', 'rate', i);

				if(isConsignment){
					if(intAmt || intBasePrice || intBaseRate || intRate)
					{
						var stItemText = currentRecord.getSublistValue('item', 'item_display', i);
						arrErrorItems.push(stItemText);
					}
				}
			}

			if(arrErrorItems.length > 0){
				alert('User Error: The following consigment items should have 0 base price, rate and amount: \n'+arrErrorItems);
				return false;
			}

			return true;

			/*
            var isApplyReprice = currentRecord.getValue(lib.TRANS_BODY_FLDS.FLD_IS_APPLY_REPRICE);

            if (isApplyReprice) {

                var options = {
                    title: "Detected to be applicable for Basket Repricing",
                    message: "This sales order has been detected to be applicable for Basket Repricing. In order to save the order without repricing, click on OK. If you want to reprice, choose 'Cancel', then click on 'Apply Basket Repricing'"
                };

                if (!isConfirm) {
                    dialog.confirm(options).then(success).catch(failure);
                } else {
                    currentRecord.setValue({
                        fieldId: lib.TRANS_BODY_FLDS.FLD_IS_APPLY_REPRICE,
                        value: false,
                        ignoreFieldChange: true
                    });
                    isConfirm = false;
                    return thisResult;
                }

            } else {
                return true;
            }
            */
		}

		function success(result) {
			thisResult = result;
			isConfirm = true;
			getNLMultiButtonByName('multibutton_submitter').onMainButtonClick(this);
			return true;
		}

		function failure(reason) {
			return false;
		}

		function calContracts(currentRecord) {

			debugger;
			//alert('calContracts');
			var jsonLine = {};
			var currLine = currentRecord.getCurrentSublistIndex('item');
			var jsonValue = currentRecord.getValue(lib.TRANS_BODY_FLDS.JSON_LINE);

			if(lib.convNull(jsonValue) != '') {
				if (JSON.stringify(jsonValue) != '{}') jsonLine = JSON.parse(jsonValue);
			}

			if(JSON.stringify(jsonLine) != '{}'){

				var currQty = 0;

				//getting the unit
				var uom = currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_UNIT,
					line: currLine
				});

				if (uom == lib.UNIT.KG) {

					currQty += Number(currentRecord.getCurrentSublistValue({
						sublistId: 'item',
						fieldId: lib.TRANS_LINE_FLDS.TOTAL_WEIGHT_BASE,
						line: currLine
					}));

				} else {
					currQty += Number(currentRecord.getCurrentSublistValue({
						sublistId: 'item',
						fieldId: 'quantity',
						line: currLine
					}));
				}

				var prvQty = Number(currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
					line: currLine
				}));

				var itemVolContract = currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_CONTRACT,
					line: currLine
				});
				var contractId = 0;
				var contractName = '';

				contractId = currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: lib.TRANS_LINE_FLDS.CONTRACT_REF_KEY,
					line: currLine
				});

				//if (itemVolContract == true || itemVolContract == 'T') {
				contractName = currentRecord.getCurrentSublistText({
					sublistId: 'item',
					fieldId: lib.TRANS_LINE_FLDS.CONTRACT_REF_KEY,
					line: currLine
				});
				/**} else {
				contractName = currentRecord.getCurrentSublistText({
					sublistId: 'item',
					fieldId: lib.TRANS_LINE_FLDS.CONTRACT_HEADER,
					line: currLine
				});
			}
				 */

				var stHeader = currentRecord.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: lib.TRANS_LINE_FLDS.CONTRACT_HEADER,
					line: currLine
				});

				//get accumulated qty per contract
				var lineCnt = currentRecord.getLineCount('item');
				var totalQty = 0;
				var prevQty = 0;
				if (lineCnt > 0) {

					for (var i = 0; i < lineCnt; i++) {

						var cnt = i;
						//check if the loop get the currLine
						if (currLine == cnt) {
							continue;
						}

						//getting the unit
						var ivUnit = currentRecord.getSublistValue({
							sublistId: 'item',
							fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_UNIT,
							line: cnt
						});

						//getting the item volume contract
						var ivCont = currentRecord.getSublistValue({
							sublistId: 'item',
							fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_CONTRACT,
							line: cnt
						});
						var cId = currentRecord.getSublistValue({
							sublistId: 'item',
							fieldId: lib.TRANS_LINE_FLDS.CONTRACT_REF_KEY,
							line: cnt
						});

						var stHeaderLine = currentRecord.getSublistValue({
							sublistId: 'item',
							fieldId: lib.TRANS_LINE_FLDS.CONTRACT_HEADER,
							line: cnt
						});

						if (itemVolContract == true || itemVolContract == 'T')
						{
							if (cId != contractId) {
								continue;
							}
						}
						else
						{
							if(stHeader != stHeaderLine)
							{
								continue;
							}
						}


						//Check the unit if KG then get TOTAL WEIGHT BASE else quantity

						if (ivUnit == lib.UNIT.KG) {

							totalQty += Number(currentRecord.getSublistValue({
								sublistId: 'item',
								fieldId: lib.TRANS_LINE_FLDS.TOTAL_WEIGHT_BASE,
								line: cnt
							}));

						} else {
							totalQty += Number(currentRecord.getSublistValue({
								sublistId: 'item',
								fieldId: 'quantity',
								line: cnt
							}));
						}

						prevQty += Number(currentRecord.getSublistValue({
							sublistId: 'item',
							fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
							line: cnt
						}));

					}
					totalQty += currQty;
					prevQty += prvQty;
				} else {
					totalQty += currQty;
				}

				//validate the JSON field  and set the new balance quantity;



				var newValue = 0;
				if (jsonLine[contractId]) {
					var jsonQty = jsonLine[contractId].balanceQty;
					var hdr = jsonLine[contractId].hdr;
					if (totalQty > 0)
					{
						//check if there is any changes
						if (prevQty == totalQty) {
							newValue = Number(jsonQty);
						}
						else if (prevQty != totalQty) {
							newValue = Number(jsonQty) + Number(prevQty - totalQty);
						} else {
							newValue = Number(jsonQty) - Number(totalQty);
						}

						if (jsonLine[contractId].newBalanceQty == null) {
							jsonLine[contractId] = {
								'balanceQty': jsonQty,
								'newBalanceQty': newValue.toFixed(2),
								'hdr' : hdr,
							}
						} else {
							jsonLine[contractId].newBalanceQty = newValue.toFixed(2);
						}

						//update balance of the rest of contract line with same header
						if(jsonLine[contractId].hdr)
						{
							for (var intCtrJson in jsonLine)
							{
								if(jsonLine[intCtrJson].hdr == jsonLine[contractId].hdr)
								{
									jsonLine[intCtrJson].newBalanceQty = jsonLine[contractId].newBalanceQty;
								}
							}
						}

						//update the json field
						currentRecord.setValue(lib.TRANS_BODY_FLDS.JSON_LINE, JSON.stringify(jsonLine));

						//Start - Alert "New Balance of <Contract Name> is <Balance from JSON file>"  MJ-02/11/2019
						dialog.alert({
							title : "Information",
							message : 'New Balance of '+contractName+' is '+jsonLine[contractId].newBalanceQty
						});
						//End - Alert "New Balance of <Contract Name> is <Balance from JSON file>"  MJ-02/11/2019
					}
				}

			}
		}

		function checkDiscount(currentRecord)
		{
			debugger;

			var currLine = currentRecord.getCurrentSublistIndex('item');

			// if Basket Discount Indicator is true and the quantity is changed, set the Apply Basket Discount Indicator to true
			var jsonLine = {};
			var jsonValue = currentRecord.getValue(lib.TRANS_BODY_FLDS.JSON_LINE);
			if(lib.convNull(jsonValue) != '') {
				if (JSON.stringify(jsonValue) != '{}') jsonLine = JSON.parse(jsonValue);
			}

			//WNZ-565 IF WNZ Consignment = TRUE THEN Do Not Retrieve Discounts
			var bConsigment = currentRecord.getCurrentSublistValue({
				sublistId: 'item',
				fieldId: 'custcol_wnz_is_consignment'
			});

			//alert(bConsigment);
			if(bConsigment) return;

			//WNZ-172
			var stGrossNetInd = currentRecord.getCurrentSublistValue({
				sublistId: 'item',
				fieldId: lib.TRANS_LINE_FLDS.GROSS_NETT_IND
			});

			if(lib.GROSSNET.NETT == stGrossNetInd)
			{
				return;
			}
			//END WNZ-172


			lib.showMantle('Applying discount.. Please wait.');
			setTimeout(function() {
				lib.hideMantle();
			}, 300);


			var prevQty = lib.forceFloat(currentRecord.getCurrentSublistValue({
				sublistId: 'item',
				fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
				line: currLine
			}));

			var currQty = lib.forceFloat(currentRecord.getCurrentSublistValue({
				sublistId: 'item',
				fieldId: 'quantity',
				line: currLine
			}));

			var itemVolContract = currentRecord.getCurrentSublistValue({
				sublistId: 'item',
				fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_CONTRACT,
				line: currLine
			});

			var GNIndicator = currentRecord.getCurrentSublistValue({
				sublistId: 'item',
				fieldId: lib.TRANS_LINE_FLDS.GROSS_NETT_IND,
				line: currLine
			});

			var contractId = 0;
			var contractName = '';

			//GETTERS
			var objParam = {};
			objParam.stCustomer = currentRecord.getValue('entity');
			objParam.isGroupPrice = currentRecord.getCurrentSublistValue({
				sublistId: 'item',
				fieldId: lib.TRANS_LINE_FLDS.ITEM_GRP_PRICING,
				line: currLine
			});
			objParam.stQty = currentRecord.getCurrentSublistValue({
				sublistId: 'item',
				fieldId: 'quantity',
				line: currLine
			});

			objParam.stPriceDate = currentRecord.getValue(lib.TRANS_BODY_FLDS.PRICE_DATE);
			var dDate = new Date(objParam.stPriceDate);
			var stDate = format.format({
				value: dDate,
				type: format.Type.DATE
			});


			objParam.stItemGrp = currentRecord.getCurrentSublistValue({
				sublistId: 'item',
				fieldId: lib.TRANS_LINE_FLDS.FLD_MAT_GRP,
				line: currLine
			});


			objParam.stItem = currentRecord.getCurrentSublistValue({
				sublistId: 'item',
				fieldId: 'item',
				line: currLine
			});

			// Inside WNZ_FieldChanged_Pricing function, upon changing the line Quantity (quantity), run the search:
			if (objParam.stCustomer && (objParam.stItem || objParam.stItemGrp) && objParam.stQty && objParam.stPriceDate && (GNIndicator == lib.GROSSNET.GROSS || GNIndicator == '' || GNIndicator == null))
			{

				var filters = [
					['custrecord_wnz_ocp_discount_vendor', 'anyof', objParam.stCustomer], 'and',
					['custrecord_wnz_threshold_discount_pr', 'lessthanorequalto', objParam.stQty]
				];

				if(objParam.stItem && objParam.stItemGrp)
				{
					filters.push('and');
					var arrAnd = [];
					arrAnd.push(['custrecord_wnz_item_discount_pr', 'anyof', objParam.stItem]);
					arrAnd.push('or');
					arrAnd.push(['custrecord_wnz_item_group_pr', 'anyof', objParam.stItemGrp]);
					filters.push(arrAnd);
				}
				else if (objParam.stItem)
				{
					filters.push('and');
					filters.push(['custrecord_wnz_item_discount_pr', 'anyof', objParam.stItem]);
				}
				else if (objParam.stItemGrp)
				{
					filters.push('and');
					filters.push(['custrecord_wnz_item_group_pr', 'anyof', objParam.stItemGrp]);
				}

				//SEARCH 1
				var arrResult = lib.runSearch(search, null, SEARCH_PRICING_DISCOUNT, filters);
				// log.debug("filters", JSON.stringify(filters));
				debugger;

				var arrResultSet = arrResult.getRange({
					start: 0,
					end: 1000
				});

				var objResult = {};
				objResult.flLDDiscountVal = '';
				objResult.flAdjustmentType = '';
				var hasItem = false;
				var lineNum;
				var lineDiscount = "";

				var arrResultSet = arrResult.getRange({
					start: 0,
					end: 1000
				});

				if (arrResultSet.length > 0) {
					/*
                    * Refactor to not change anything in the script already live
                    * */
					//check first if there is item on the record
					for (var x = 0; x < arrResultSet.length; x++) {
						var currItem = arrResultSet[x].getValue({
							name: "custrecord_wnz_item_discount_pr"
						});
						if(currItem != "") {
							hasItem = true;
							lineNum = x;
						}
					}

					// Loop through the results and get the LD and PD
					/*for (var x = 0; x < arrResultSet.length; x++)
                    {
                        var flDiscountVal = lib.forceFloat(arrResultSet[x].getValue('custrecord_wnz_discount_value_pr'));
                        objResult.flAdjustmentType = arrResultSet[x].getValue('custrecord_wnz_adjustment_type_pr');
                        if(objResult.flAdjustmentType == lib.ADJUSTMENT_TYPE.PLD) {
                            if(flDiscountVal)
                            {
                                objResult.flLDDiscountVal = flDiscountVal;
                            }
                        }
                    }*/
				}
				if (arrResultSet.length > 0) {
					if(!hasItem) {
						//just get the first in the line
						lineDiscount = lib.forceFloat(arrResultSet[0].getValue('custrecord_wnz_discount_value_pr'));
					} else {
						lineDiscount = lib.forceFloat(arrResultSet[lineNum].getValue('custrecord_wnz_discount_value_pr'));
					}
				}


				//Setters
				currentRecord.setCurrentSublistValue({
					sublistId: 'item',
					fieldId: lib.TRANS_LINE_FLDS.FLD_LINE_DISC,
					//value: objResult.flLDDiscountVal,
					value: lineDiscount,
					ignoreFieldChange: true
				});

			}
		}

		function resetDiscountLines(currentRecord)
		{
			currentRecord.setCurrentSublistValue('item', lib.TRANS_LINE_FLDS.FLD_LINE_DISC, '');
			currentRecord.setCurrentSublistValue('item', lib.TRANS_LINE_FLDS.FLD_LD_TYPE, '');
			currentRecord.setCurrentSublistValue('item', lib.TRANS_LINE_FLDS.FLD_CURNET_LD, '');

		}

		function setConsignmentAmt(currentRecord)
		{
			currentRecord.setCurrentSublistValue('item',  'custcol_wnz_ocp_base_price', 0);
			currentRecord.setCurrentSublistValue('item',  'custcol_wnz_wentzel_rate', 0);
			currentRecord.setCurrentSublistValue('item',  'rate', 0);
			currentRecord.setCurrentSublistValue('item',  'amount', 0);

		}

		function isValidDate(dateObject){
			return new Date(dateObject).toString() !== 'Invalid Date';
		}


		function checkMVF(item, vendor)
		{
			var stLogTitle = 'checkMVF';

			var stDate = '';

			if(!item || !vendor) return stDate;

			var arrFilter = [];
			arrFilter.push(search.createFilter({
				name: "custrecord_wnz_item_vendorsublist",
				operator: 'is',
				values: item
			}));
			arrFilter.push(search.createFilter({
				name: "custrecord_wnz_vendor_vendorsublist",
				operator: 'is',
				values: vendor
			}));

			var tmpCols = new Array();
			tmpCols.push(search.createColumn({name: 'custrecord_wnz_vendoritem_vendorsublist'}));

			var arrResult = lib.runSearch(search, 'customrecord_wnz_multi_vendor_fields', null, arrFilter, tmpCols);
			var searchresults = arrResult.getRange({
				start: 0,
				end: 10
			});

			for ( var intCtr = 0; intCtr < searchresults.length; intCtr++)
			{
				var obj = searchresults[intCtr]

				stDate = obj.getValue({name : "custrecord_wnz_vendoritem_vendorsublist"});

			}
			log.debug(stLogTitle, '>> stDate:: ' + stDate);

			return stDate;
		}

		function toFixed(num, fixed) {
			var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
			return num.toString().match(re)[0];
		}

		return {
			validateLine: WNZ_ValidateLine_Pricing,
			validateDelete: WNZ_ValidateDelete_Pricing,
			lineInit: WNZ_LineInit_Pricing,
			fieldChanged: WNZ_FieldChanged_Pricing,
			pageInit: WNZ_PageInit_Control,
			postSourcing : WNZ_PostSourcing_Pricing,
			saveRecord : WNZ_SaveRecord_Pricing,
		};

	});