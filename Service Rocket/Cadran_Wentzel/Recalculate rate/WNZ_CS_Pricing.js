/**
 *     |---------------------------------------------------------------------------------------------------------------------------------------|
 *     | Author                      | Date          | Version       | Comments                                                                |
 *     |-----------------------------|---------------|---------------|-------------------------------------------------------------------------|
 *     | L.Columna                   | Dec 12, 2018  | 1.0           | Initial Version                                                         |
 *     |---------------------------------------------------------------------------------------------------------------------------------------|
 */

/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define([
  "N/record",
  "N/search",
  "N/currentRecord",
  "N/format",
  "N/ui/dialog",
  "N/ui",
  "./WNZ_OCP_Library.js",
]
/**
 * @param {record}
 * record
 */, function (record, search, currentRec, format, dialog, ui, lib) {
  var isConfirm = false;
  var thisResult = false;
  var SEARCH_PRICING_DISCOUNT = "customsearch_wnz_ocp_pricing_discount";
  var SEARCH_ITEM_ADDRESS = "customsearch_wnz_address_list";
  var SEARCH_CRE_LIMIT = "customsearch_wnz_credit_limit";
  var SEARCH_CONTRACT_DETAIL = "customsearch_wnz_contract_details";
  var FL_OLD_TOTAL = 0;
  var bIsBasketPricing = false;
  var OLD_QUANTITY = 0;
  var CONTEXT_MODE = "";
  function computeTotalDiscount(currentRecord) {
    var stLDType = currentRecord.getCurrentSublistValue({
      sublistId: "item",
      fieldId: "custcol_wnz_ocp_ld_type",
    });
    var flTotal = 0;
    if (stLDType == "1") {
      //% Type
      var flRate =
        parseFloat(
          currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "rate",
          })
        ) || 0;
      var flPriceFactor =
        parseFloat(
          currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol_wnz_price_factor",
          })
        ) || 0;
      var flBase =
        parseFloat(
          currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol_wnz_ocp_base_price",
          })
        ) || 0;
      var lineDiscount =
        parseFloat(
          currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol_wnz_ocp_ld",
          })
        ) || 0;
      var flBasketDiscount =
        parseFloat(
          currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol_wnz_ocp_basket_discount",
          })
        ) || 0;
      var flPromoDiscount =
        parseFloat(
          currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol_wnz_ocp_promotion_discount",
          })
        ) || 0;

      if (lineDiscount == 100) {
        flTotal = 100;
      } else {
        // if(flRate != "" && flBase != ""){
        //     flTotal = (1 - (flRate/(flBase/flPriceFactor))) * 100;
        // }
        // flTotal = lineDiscount + flPromoDiscount + flBasketDiscount;
        if (flRate != 0 && flBase != 0) {
          flTotal = parseFloat(parseFloat(flRate - flBase) / flBase) * 100 * -1;
        }
      }
      currentRecord.setCurrentSublistValue(
        "item",
        "custcol_wnz_total_discount",
        flTotal.toFixed(1)
      );
    } else {
      var flLineDiscount =
        parseFloat(
          currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol_wnz_ocp_ld",
          })
        ) || 0;
      var flPromoDiscount =
        parseFloat(
          currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol_wnz_ocp_promotion_discount",
          })
        ) || 0;
      var flBasketDiscount =
        parseFloat(
          currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol_wnz_ocp_basket_discount",
          })
        ) || 0;

      flTotal = flLineDiscount + flPromoDiscount + flBasketDiscount;
      currentRecord.setCurrentSublistValue(
        "item",
        "custcol_wnz_total_discount",
        flTotal.toFixed(1)
      );
    }
  }

  function getAddressListDef(stCustomer) {
    var objDef = {};
    var cust = record.load({
      type: "customer",
      id: stCustomer,
      isDynamic: true,
    });

    var intExLen = cust.getLineCount("addressbook");

    for (var intCtr = 0; intCtr < intExLen; intCtr++) {
      var bDefBilling = cust.getSublistValue(
        "addressbook",
        "defaultbilling",
        intCtr
      );
      if (bDefBilling) {
        objDef.billing = cust.getSublistValue(
          "addressbook",
          "internalid",
          intCtr
        );
      }
      var bDefShipping = cust.getSublistValue(
        "addressbook",
        "defaultshipping",
        intCtr
      );
      if (bDefShipping) {
        objDef.shipping = cust.getSublistValue(
          "addressbook",
          "internalid",
          intCtr
        );
      }
    }

    return objDef;
  }

  function WNZ_PageInit_Control(context) {
    // NATO | 02/06/2020 | hides the row where Clear All Lines is located
    jQuery("#tr_clearsplitsitem").hide();

    //debugger;
    var newRecord = currentRec.get();

    CONTEXT_MODE = context.mode;
    FL_OLD_TOTAL = parseFloat(newRecord.getValue("total")) || 0;

    checkCreditLimit(newRecord, 0, 0, true);

    if (context.mode == "copy" || context.mode == "create") {
      if (!newRecord.getValue("billaddresslist")) {
        var stCustomer = newRecord.getValue("entity");
        var objDef = getAddressListDef(stCustomer);
        if (objDef.billing) {
          newRecord.setValue("billaddresslist", objDef.billing);
        }
        if (objDef.shipping) {
          newRecord.setValue("shipaddresslist", objDef.shipping);
        }
      }
    }

    if (context.mode == "copy") {
      var intDetailLine = newRecord.getLineCount("item");

      for (var i = 0; i < intDetailLine; i++) {
        newRecord.selectLine({
          sublistId: "item",
          line: i,
        });

        //Item Type
        var stItemType = newRecord.getCurrentSublistValue({
          sublistId: "item",
          fieldId: "itemtype",
        });

        if (stItemType == "Group" || stItemType == "EndGroup") {
          continue;
        }

        newRecord.setCurrentSublistValue({
          sublistId: "item",
          fieldId: lib.TRANS_LINE_FLDS.CONTRACT_REF_KEY,
          value: "",
        });

        newRecord.setCurrentSublistValue({
          sublistId: "item",
          fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
          value: "",
        });

        newRecord.commitLine({
          sublistId: "item",
        });
      }
    }
  }

  function WNZ_LineInit_Pricing(context) {
    //debugger;

    var currentRecord = context.currentRecord;
    var sublistName = context.sublistId;
    var recordType = currentRecord.type;

    var lineCt = currentRecord.getLineCount("item");

    // if Contract is NETT, disable Line and Promotion Discounts
    if (sublistName == "item") {
      var currLine = currentRecord.getCurrentSublistIndex("item");

      //Item Type
      var stItemType = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: "itemtype",
      });

      if (stItemType == "Group" || stItemType == "EndGroup") {
        return true;
      }

      var uom = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_UNIT,
      });

      OLD_QUANTITY = Number(
        currentRecord.getCurrentSublistValue({
          sublistId: "item",
          fieldId: "quantity",
        })
      );

      if (uom == lib.UNIT.KG) {
        OLD_QUANTITY = Number(
          currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.TOTAL_WEIGHT_BASE,
          })
        );
      }

      //WNZ-172
      var stGrossNetInd = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.GROSS_NETT_IND,
      });

      if (
        lineCt > 0 &&
        currLine < lineCt &&
        stGrossNetInd != lib.GROSSNET.NETT
      ) {
        // if current line is less than line count, continue with the script
        //End WNX-172

        var stGrossNet = currentRecord.getCurrentSublistValue({
          sublistId: "item",
          fieldId: lib.TRANS_LINE_FLDS.GROSS_NETT_IND,
        });

        var objLDFld = currentRecord.getSublistField({
          sublistId: "item",
          fieldId: lib.TRANS_LINE_FLDS.FLD_LINE_DISC,
          line: currLine,
        });

        var objPdFld = currentRecord.getSublistField({
          sublistId: "item",
          fieldId: lib.TRANS_LINE_FLDS.FLD_PROMO_DISC,
          line: currLine,
        });

        var isDisabled = false;

        switch (stGrossNet) {
          case lib.GROSSNET.NETT:
            currentRecord.setCurrentSublistValue({
              sublistId: "item",
              fieldId: lib.TRANS_LINE_FLDS.FLD_LINE_DISC,
              value: 0,
              ignoreFieldChange: true,
            });
            currentRecord.setCurrentSublistValue({
              sublistId: "item",
              fieldId: lib.TRANS_LINE_FLDS.FLD_PROMO_DISC,
              value: 0,
              ignoreFieldChange: true,
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

        if (objPdFld) {
          objPdFld.isDisabled = isDisabled; // disable or enable promotion discount field
        }
      }
    }
  }

  function WNZ_PostSourcing_Pricing(context) {
    var currentRecord = context.currentRecord;
    var fldName = context.fieldId;
    var sublistName = context.sublistId;
    var recordType = currentRecord.type;

    //WNZ 568
    if (fldName == "custcol_wnz_preferred_sales_packaging") {
      //Item Type
      var stSalesPack = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: "custcol_wnz_preferred_sales_packaging",
      });

      if (stSalesPack) {
        // NATO | 1/7/2020 | Remove to fix WNZ-669
        // var arrResultSalesPack = stSalesPack.match(/\((.*)\)/);
        // if(arrResultSalesPack[1]){
        // 	currentRecord.setCurrentSublistValue('item', 'custcol_wnz_qty_pref_packaging', arrResultSalesPack[1]);
        // }
        var objUnitsType = {};

        var stItem = currentRecord.getCurrentSublistValue({
          sublistId: "item",
          fieldId: "item",
        });

        var unitstypeSearchObj = search.create({
          type: "unitstype",
          filters: [["internalid", "anyof", stItem]],
          columns: [
            search.createColumn({
              name: "unitname",
              sort: search.Sort.ASC,
              label: "Unit Name",
            }),
            search.createColumn({ name: "unitname", label: "Unit Name" }),
            search.createColumn({ name: "conversionrate", label: "Rate" }),
          ],
        });
        var searchResultCount = unitstypeSearchObj.runPaged().count;

        unitstypeSearchObj.run().each(function (result) {
          objUnitsType[result.getValue({ name: "unitname" })] = {
            unitName: result.getValue({ name: "unitname" }),
            conversionRate: result.getValue({ name: "conversionrate" }),
          };
          return true;
        });

        currentRecord.setCurrentSublistValue(
          "item",
          "custcol_wnz_qty_pref_packaging",
          objUnitsType[stSalesPack].conversionRate
        );
      } else {
        currentRecord.setCurrentSublistValue(
          "item",
          "custcol_wnz_qty_pref_packaging",
          ""
        );
      }
    }

    if (fldName == "shipaddresslist") {
      var stShipId = currentRecord.getValue("shippingaddress_key");

      if (stShipId) {
        var addressSearch = search.load({
          id: SEARCH_ITEM_ADDRESS,
        });

        addressSearch.filters.push(
          search.createFilter({
            name: "internalid",
            join: "address",
            operator: "anyof",
            values: stShipId,
          })
        );

        var shipAddressList = addressSearch.run().getRange(0, 1);
        if (shipAddressList != null && shipAddressList.length > 0) {
          var stDeliveryInstruction = shipAddressList[0].getValue({
            name: "custrecord_wnz_delivery_instruction",
            join: "Address",
          });
          var stOVLInstruction = shipAddressList[0].getValue({
            name: "custrecord_wnz_orderverzamel_instructie",
            join: "Address",
          });
          var stTransportRegion = shipAddressList[0].getValue({
            name: "custrecord_wnz_transport_region_shipto",
            join: "Address",
          });
          var stDeliveryMethod = shipAddressList[0].getValue({
            name: "custrecord_wnz_delivery_method",
            join: "Address",
          });

          currentRecord.setValue({
            fieldId: "custbody_wnz_delivery_instructions",
            value: stDeliveryInstruction,
            ignoreFieldChange: true,
          });

          currentRecord.setValue({
            fieldId: "custbody_wnz_ovl_instructie",
            value: stOVLInstruction,
            ignoreFieldChange: true,
          });

          currentRecord.setValue({
            fieldId: "custbody_wnz_transport_region_so",
            value: stTransportRegion,
          });

          currentRecord.setValue({
            fieldId: "custbody_wnz_delivery_method",
            value: stDeliveryMethod,
          });
        }
      }
    }

    if (sublistName == "item" && fldName == "item") {
      //Item Type
      var stItemType = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: "itemtype",
      });

      var intQty = Number(
        currentRecord.getCurrentSublistValue({
          sublistId: "item",
          fieldId: "quantity",
        })
      );

      var flMinAllowableQty = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: "custcolwnz_ocp_physical_base_conv",
      });

      //WNZ 922
      var intQtyPackaging = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: "custcol_wnz_qty_pref_packaging",
      });

      if (intQtyPackaging) {
        currentRecord.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "quantity",
          value: intQtyPackaging,
          ignoreFieldChange: true,
        });
      } else {
        if (flMinAllowableQty) {
          if (parseFloat(flMinAllowableQty) > parseFloat(intQty)) {
            currentRecord.setCurrentSublistValue({
              sublistId: "item",
              fieldId: "quantity",
              value: flMinAllowableQty,
              ignoreFieldChange: true,
            });
            intQty = flMinAllowableQty;
          } else {
            currentRecord.setCurrentSublistValue({
              sublistId: "item",
              fieldId: "quantity",
              value: intQty,
              ignoreFieldChange: true,
            });
          }
        } else {
          currentRecord.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            value: intQty,
            ignoreFieldChange: true,
          });
        }
      }
      //END WNZ 922

      var intPrevQty = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
      });

      var bHasContract = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.CONTRACT_REF_KEY,
      });

      if (intPrevQty == "" || intPrevQty == null) {
        if (bHasContract) {
          var stVolUOM = curRec.getCurrentSublistValue({
            sublistId: "custpage_sublist",
            fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_UNIT,
          });

          if (stVolUOM == lib.UNIT.KG) {
            currentRecord.setCurrentSublistValue({
              sublistId: "item",
              fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
              value: intQty,
            });
          } else {
            currentRecord.setCurrentSublistValue({
              sublistId: "item",
              fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
              value: lib.TRANS_LINE_FLDS.TOTAL_WEIGHT_BASE,
            });
          }
        }
      }

      if (stItemType == "Group" || stItemType == "EndGroup") {
        return true;
      }

      checkDiscount(currentRecord);

      //WNZ-172
      var stGrossNetInd = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.GROSS_NETT_IND,
      });

      if (lib.GROSSNET.NETT == stGrossNetInd) {
        resetDiscountLines(currentRecord);
      }

      computeTotalDiscount(currentRecord);
    }
  }

  function WNZ_ValidateLine_Pricing(context) {
    var currentRecord = context.currentRecord;
    var fldName = context.fieldId;
    calculateAmounts(currentRecord);
    return true;
  }

  function resetDiscountLines(currentRecord) {
    currentRecord.setCurrentSublistValue(
      "item",
      lib.TRANS_LINE_FLDS.FLD_PROMO_DISC,
      ""
    );
    currentRecord.setCurrentSublistValue(
      "item",
      lib.TRANS_LINE_FLDS.FLD_PROMO_DISC_TYPE,
      ""
    );
    currentRecord.setCurrentSublistValue(
      "item",
      lib.TRANS_LINE_FLDS.FLD_LINE_DISC,
      ""
    );
    currentRecord.setCurrentSublistValue(
      "item",
      lib.TRANS_LINE_FLDS.FLD_LD_TYPE,
      ""
    );
    currentRecord.setCurrentSublistValue(
      "item",
      lib.TRANS_LINE_FLDS.FLD_BASKET_DISC,
      ""
    );
    currentRecord.setCurrentSublistValue(
      "item",
      lib.TRANS_LINE_FLDS.FLD_BASKET_DISC_TYPE,
      ""
    );
    //currentRecord.setCurrentSublistValue('item', lib.TRANS_LINE_FLDS.FLD_BASKET_DISC_IND, '');
    currentRecord.setCurrentSublistValue(
      "item",
      lib.TRANS_LINE_FLDS.FLD_CURNET_LD,
      ""
    );
    currentRecord.setCurrentSublistValue(
      "item",
      lib.TRANS_LINE_FLDS.FLD_CURNET_PD,
      ""
    );
    currentRecord.setCurrentSublistValue(
      "item",
      lib.TRANS_LINE_FLDS.FLD_CURNET_BT,
      ""
    );
  }

  function WNZ_ValidateDelete_Pricing(context) {
    //debugger;

    var currentRecord = context.currentRecord;
    var fldName = context.fieldId;
    var sublistName = context.sublistId;
    var recordType = currentRecord.type;
    var jsonLine = {};
    var jsonValue = currentRecord.getValue(lib.TRANS_BODY_FLDS.JSON_LINE);

    if (lib.convNull(jsonValue) != "") {
      if (JSON.stringify(jsonValue) != "{}") jsonLine = JSON.parse(jsonValue);
    }

    if (sublistName == "item") {
      var currLine = currentRecord.getCurrentSublistIndex("item");

      //Item Type
      var stItemType = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: "itemtype",
      });

      var bHasContract = false;
      var stItemLineType = "";
      if (stItemType == "Group") {
        do {
          var stContractHeader = currentRecord.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_wnz_contract_header",
            line: currLine + 1,
          });

          if (stContractHeader) {
            bHasContract = true;
          }

          var currQty = currentRecord.getSublistValue({
            sublistId: sublistName,
            fieldId: "quantity",
            line: currLine + 1,
          });

          var prevQty = currentRecord.getSublistValue({
            sublistId: sublistName,
            fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
            line: currLine + 1,
          });

          //getting the unit
          var ivUnit = currentRecord.getSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_UNIT,
            line: currLine + 1,
          });

          if (ivUnit == lib.UNIT.KG) {
            currQty = currentRecord.getSublistValue({
              sublistId: sublistName,
              fieldId: lib.TRANS_LINE_FLDS.TOTAL_WEIGHT_BASE,
              line: currLine + 1,
            });
          }
          stItemLineType = currentRecord.getSublistValue({
            sublistId: "item",
            fieldId: "itemtype",
            line: currLine + 1,
          });

          var itemVolContract = currentRecord.getSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_CONTRACT,
            line: currLine + 1,
          });

          var contractId = currentRecord.getSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.CONTRACT_REF_KEY,
            line: currLine + 1,
          });

          var itemTotalWeigthBase = currentRecord.getSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.TOTAL_WEIGHT_BASE,
            line: currLine + 1,
          });

          //validate the json field
          if (JSON.stringify(jsonLine) != "{}") {
            if (jsonLine[contractId]) {
              var jsonQty = jsonLine[contractId].balanceQty;

              if (jsonLine[contractId].newBalanceQty == null) {
                jsonLine[contractId] = {
                  balanceQty: jsonQty,
                  newBalanceQty: parseFloat(jsonQty) + parseFloat(currQty),
                  hdr: jsonLine[contractId].hdr,
                };
              } else if (
                !prevQty &&
                jsonLine[contractId] &&
                jsonLine[contractId].newBalanceQty
              ) {
                jsonLine[contractId] = {
                  balanceQty: jsonQty,
                  newBalanceQty:
                    parseFloat(jsonLine[contractId].newBalanceQty) +
                    parseFloat(currQty),
                  hdr: jsonLine[contractId].hdr,
                };
              } else {
                jsonLine[contractId] = {
                  balanceQty: jsonQty,
                  newBalanceQty:
                    parseFloat(jsonLine[contractId].newBalanceQty) +
                    parseFloat(currQty),
                  hdr: jsonLine[contractId].hdr,
                };
              }

              //update balance of the rest of contract line with same header
              if (jsonLine[contractId].hdr) {
                for (var intCtrJson in jsonLine) {
                  if (jsonLine[intCtrJson].hdr == jsonLine[contractId].hdr) {
                    jsonLine[intCtrJson].newBalanceQty =
                      jsonLine[contractId].newBalanceQty;
                  }
                }
              }
            }

            currentRecord.setValue(
              lib.TRANS_BODY_FLDS.JSON_LINE,
              JSON.stringify(jsonLine)
            );
          }

          currLine++;
        } while (stItemLineType != "EndGroup");

        return true;
      } else if (stItemType == "EndGroup") {
        do {
          var stContractHeader = currentRecord.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_wnz_contract_header",
            line: currLine - 1,
          });

          if (stContractHeader) {
            bHasContract = true;
          }

          var currQty = currentRecord.getCurrentSublistValue({
            sublistId: sublistName,
            fieldId: "quantity",
          });

          var prevQty = currentRecord.getCurrentSublistValue({
            sublistId: sublistName,
            fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
          });

          stItemLineType = currentRecord.getSublistValue({
            sublistId: "item",
            fieldId: "itemtype",
            line: currLine - 1,
          });

          var itemVolContract = currentRecord.getSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_CONTRACT,
            line: currLine - 1,
          });

          var contractId = currentRecord.getSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.CONTRACT_REF_KEY,
            line: currLine - 1,
          });

          var itemTotalWeigthBase = currentRecord.getSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.TOTAL_WEIGHT_BASE,
            line: currLine - 1,
          });

          //validate the json field
          if (JSON.stringify(jsonLine) != "{}") {
            if (jsonLine[contractId]) {
              var jsonQty = jsonLine[contractId].balanceQty;

              if (jsonLine[contractId].newBalanceQty == null) {
                jsonLine[contractId] = {
                  balanceQty: jsonQty,
                  newBalanceQty:
                    parseFloat(jsonQty) + parseFloat(itemTotalWeigthBase),
                  hdr: jsonLine[contractId].hdr,
                };
              } else if (
                !prevQty &&
                jsonLine[contractId] &&
                jsonLine[contractId].newBalanceQty
              ) {
                jsonLine[contractId] = {
                  balanceQty: jsonQty,
                  newBalanceQty:
                    parseFloat(jsonLine[contractId].newBalanceQty) +
                    parseFloat(itemTotalWeigthBase),
                  hdr: jsonLine[contractId].hdr,
                };
              } else {
                jsonLine[contractId] = {
                  balanceQty: jsonQty,
                  newBalanceQty:
                    parseFloat(jsonLine[contractId].newBalanceQty) +
                    parseFloat(itemTotalWeigthBase),
                  hdr: jsonLine[contractId].hdr,
                };
              }

              //update balance of the rest of contract line with same header
              if (jsonLine[contractId].hdr) {
                for (var intCtrJson in jsonLine) {
                  if (jsonLine[intCtrJson].hdr == jsonLine[contractId].hdr) {
                    jsonLine[intCtrJson].newBalanceQty =
                      jsonLine[contractId].newBalanceQty;
                  }
                }
              }
            }

            currentRecord.setValue(
              lib.TRANS_BODY_FLDS.JSON_LINE,
              JSON.stringify(jsonLine)
            );
          }

          currLine--;
        } while (stItemLineType != "Group");

        // if(bHasContract)
        // {
        //     // return true;
        //     alert('Cannot delete this line. Item Group has associated Contract. Please select the item inside this group and delete it.');
        //     return false;
        // }

        return true;
      }

      var currQty = currentRecord.getCurrentSublistValue({
        sublistId: sublistName,
        fieldId: "quantity",
      });

      var prevQty = currentRecord.getCurrentSublistValue({
        sublistId: sublistName,
        fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
      });

      //getting the unit
      var ivUnit = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_UNIT,
      });

      if (ivUnit == lib.UNIT.KG) {
        currQty = currentRecord.getCurrentSublistValue({
          sublistId: sublistName,
          fieldId: lib.TRANS_LINE_FLDS.TOTAL_WEIGHT_BASE,
        });
      }

      var itemVolContract = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_CONTRACT,
        line: currLine,
      });

      var contractId = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.CONTRACT_REF_KEY,
        line: currLine,
      });

      //validate the json field
      if (JSON.stringify(jsonLine) != "{}") {
        if (jsonLine[contractId]) {
          var jsonQty = jsonLine[contractId].balanceQty;

          if (jsonLine[contractId].newBalanceQty == null) {
            jsonLine[contractId] = {
              balanceQty: jsonQty,
              newBalanceQty: parseFloat(jsonQty) + parseFloat(currQty),
              hdr: jsonLine[contractId].hdr,
            };
          } else if (
            !prevQty &&
            jsonLine[contractId] &&
            jsonLine[contractId].newBalanceQty
          ) {
            jsonLine[contractId] = {
              balanceQty: jsonQty,
              newBalanceQty:
                parseFloat(jsonLine[contractId].newBalanceQty) +
                parseFloat(currQty),
              hdr: jsonLine[contractId].hdr,
            };
          } else {
            jsonLine[contractId] = {
              balanceQty: jsonQty,
              newBalanceQty:
                parseFloat(jsonLine[contractId].newBalanceQty) +
                parseFloat(currQty),
              hdr: jsonLine[contractId].hdr,
            };
          }

          //update balance of the rest of contract line with same header
          if (jsonLine[contractId].hdr) {
            for (var intCtrJson in jsonLine) {
              if (jsonLine[intCtrJson].hdr == jsonLine[contractId].hdr) {
                jsonLine[intCtrJson].newBalanceQty =
                  jsonLine[contractId].newBalanceQty;
              }
            }
          }
        }

        currentRecord.setValue(
          lib.TRANS_BODY_FLDS.JSON_LINE,
          JSON.stringify(jsonLine)
        );
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
    var currLine = currentRecord.getCurrentSublistIndex("item");
    var stContractHead = currentRecord.getCurrentSublistValue({
      sublistId: "item",
      fieldId: "custcol_wnz_contract_header",
    });

    if (
      fldName == "rate" ||
      fldName == "custcol_wnz_price_factor" ||
      fldName == "custcol_wnz_ocp_base_price" ||
      fldName == "custcol_wnz_ocp_ld_type"
    ) {
      if (
        currentRecord.getCurrentSublistValue({
          sublistId: "item",
          fieldId: lib.TRANS_LINE_FLDS.CONTRACT_REF_KEY,
        }) == ""
      ) {
        computeTotalDiscount(currentRecord);
      }
    }

    if (fldName == "custcol_wnz_tolerance" || fldName == "quantity") {
      var flQty =
        parseFloat(
          currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "quantity",
          })
        ) || 0;

      var flTolerance =
        parseFloat(
          currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol_wnz_tolerance",
          })
        ) || 0;

      var flToleranceLine = (flTolerance / 100) * flQty;
      currentRecord.setCurrentSublistValue(
        "item",
        "custcol_wnz_tolerance_line",
        format.parse({ value: flToleranceLine, type: format.Type.CURRENCY })
      );

      var intPrevQty = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
      });

      var bHasContract = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.CONTRACT_REF_KEY,
      });

      if (intPrevQty == "" || intPrevQty == null) {
        if (bHasContract) {
          var stVolUOM = currentRecord.getCurrentSublistValue({
            sublistId: "custpage_sublist",
            fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_UNIT,
          });

          if (stVolUOM == lib.UNIT.KG) {
            intCurrQty = Number(
              currentRecord.getCurrentSublistValue({
                sublistId: "item",
                fieldId: lib.TRANS_LINE_FLDS.TOTAL_WEIGHT_BASE,
              })
            );

            currentRecord.setCurrentSublistValue({
              sublistId: "item",
              fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
              value: intCurrQty,
            });
          } else {
            currentRecord.setCurrentSublistValue({
              sublistId: "item",
              fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
              value: flQty,
            });
          }
        }
      }
    }

    if (fldName == "custcol_wnz_preferred_sales_packaging") {
      ////debugger;
      //Item Type
      var stSalesPack = currentRecord.getCurrentSublistText({
        sublistId: "item",
        fieldId: "custcol_wnz_preferred_sales_packaging",
      });

      if (stSalesPack) {
        // NATO | 1/7/2020 | Remove to fix WNZ-669
        // var arrResultSalesPack = stSalesPack.match(/\((.*)\)/);
        // if(arrResultSalesPack[1]){
        // 	currentRecord.setCurrentSublistValue('item', 'custcol_wnz_qty_pref_packaging', arrResultSalesPack[1]);
        // }
        var objUnitsType = {};

        var stItem = currentRecord.getCurrentSublistValue({
          sublistId: "item",
          fieldId: "item",
        });

        if (stItem) {
          var objUOM = search.lookupFields({
            type: "item",
            id: stItem,
            columns: "unitstype",
          });
          var unitstypeSearchObj = search.create({
            type: "unitstype",
            filters: [["internalid", "anyof", objUOM.unitstype[0].value]],
            columns: [
              search.createColumn({
                name: "unitname",
                sort: search.Sort.ASC,
                label: "Unit Name",
              }),
              search.createColumn({ name: "internalid", label: "Internal Id" }),
              search.createColumn({ name: "unitname", label: "Unit Name" }),
              search.createColumn({ name: "conversionrate", label: "Rate" }),
            ],
          });
          var searchResultCount = unitstypeSearchObj.runPaged().count;

          unitstypeSearchObj.run().each(function (result) {
            objUnitsType[
              (result.getValue({ name: "internalid" }),
              result.getValue({ name: "unitname" }))
            ] = {
              conversionRate: result.getValue({ name: "conversionrate" }),
            };
            return true;
          });

          if (objUnitsType[(stItem, stSalesPack)] != undefined) {
            currentRecord.setCurrentSublistValue(
              "item",
              "custcol_wnz_qty_pref_packaging",
              objUnitsType[(stItem, stSalesPack)].conversionRate
            );
          }
        }
      } else {
        currentRecord.setCurrentSublistValue(
          "item",
          "custcol_wnz_qty_pref_packaging",
          ""
        );
      }
    }

    if ("item" == sublistName) {
      //Item Type
      var stItemType = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: "itemtype",
      });
      if (stItemType == "Group" || stItemType == "EndGroup") {
        return true;
      }
    }

    if (
      "item" == sublistName &&
      fldName == lib.TRANS_LINE_FLDS.GROSS_NETT_IND
    ) {
      var stGrossNet = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.GROSS_NETT_IND,
        line: currLine,
      });
    }

    if (
      "item" == sublistName &&
      (fldName == "quantity" || fldName == "custcol_wnz_item_base_price")
    ) {
      checkDiscount(currentRecord);

      //WNZ-172
      var stGrossNetInd = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.GROSS_NETT_IND,
      });

      if (lib.GROSSNET.NETT == stGrossNetInd) {
        resetDiscountLines(currentRecord);
      }
      computeTotalDiscount(currentRecord);
    }

    if (
      fldName == lib.TRANS_LINE_FLDS.WEIGHT_PER_UNIT &&
      sublistName == "item"
    ) {
      //getting the unit
      var uom = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_UNIT,
      });

      if (uom == lib.UNIT.KG) {
        var intQty = Number(
          currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "quantity",
          })
        );

        var flWgtPerBaseUnit = Number(
          currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.WEIGHT_PER_UNIT,
          })
        );

        var currQty = intQty * flWgtPerBaseUnit;

        currentRecord.setCurrentSublistValue({
          sublistId: "item",
          fieldId: lib.TRANS_LINE_FLDS.TOTAL_WEIGHT_BASE,
          value: currQty.toFixed(4),
        });
      }
    }
  }

  function checkCreditLimit(currentRecord, flCurrTotal, flOldTotal, bPopUp) {
    //Credit Limit
    //if with parent, get parent's credit limit and children total
    var stParent = currentRecord.getValue("custbody_wnz_parent_customer");
    var stCustomer = currentRecord.getValue("entity");

    var flCredit = 0;
    var objCC = {};
    if (stParent) {
      objCC = searchCredit(stParent);
    }
    //if without parent, get credit hold
    else {
      if (stCustomer) {
        var objCustomer = search.lookupFields({
          type: "customer",
          id: stCustomer,
          columns: ["custentity_wnz_total_balance", "creditlimit"],
        });
        objCC.creditTotal =
          parseFloat(objCustomer.custentity_wnz_total_balance) || 0;
        objCC.creditLimit = parseFloat(objCustomer.creditlimit) || 0;
      }
    }

    objCC.creditTotal = objCC.creditTotal + flCurrTotal;

    if (CONTEXT_MODE != "create" && CONTEXT_MODE != "copy") {
      objCC.creditTotal = objCC.creditTotal - flOldTotal;
    }

    if (objCC.creditTotal >= objCC.creditLimit) {
      if (
        currentRecord.getValue({
          fieldId: "custbody_wnz_credit_limit_approved",
        })
      )
        return true;
      if (bPopUp) {
        dialog
          .alert({
            title: "Kredietlimiet",
            message:
              "Klant is over het krediet limiet, deze order komt op status: pending approval en moet eerst goedgeke...",
          })
          .then(lib.alertSuccess)
          .catch(lib.alertFailure);
      } else {
        var bConfirm = confirm(
          "Klant is over het krediet limiet, deze order komt op status: pending approval en moet eerst goedgeke..."
        );
        if (!bConfirm) return false;
      }
      currentRecord.setValue("custbody_wnz_credit_limit_app", true);
    } else {
      currentRecord.setValue("custbody_wnz_credit_limit_app", false);
    }

    return true;
  }

  function searchCredit(stParent) {
    var objParent = {};
    var creditLimit = search.load({
      id: SEARCH_CRE_LIMIT,
    });

    creditLimit.filters.push(
      search.createFilter({
        name: "internalid",
        join: "parentcustomer",
        operator: "anyof",
        values: stParent,
      })
    );

    objParent.creditTotal = 0;
    objParent.creditLimit = 0;
    var creditLimitList = creditLimit.run().getRange(0, 1);

    if (creditLimitList != null && creditLimitList.length > 0) {
      objParent.creditTotal =
        parseFloat(
          creditLimitList[0].getValue({
            name: "custentity_wnz_total_balance",
            join: null,
            summary: "SUM",
          })
        ) || 0;
      objParent.creditLimit =
        parseFloat(
          creditLimitList[0].getValue({
            name: "creditlimit",
            join: "parentCustomer",
            summary: "MAX",
          })
        ) || 0;
    }

    return objParent;
  }

  function WNZ_SaveRecord_Pricing(context) {
    //debugger;
    var currentRecord = context.currentRecord;
    var sublistName = context.sublistId;

    var stLoggerTitle = "onSave";

    //Credit Limit
    //if with parent, get parent's credit limit and children total
    var flTotal = parseFloat(currentRecord.getValue("total")) || 0;
    var bReturn = checkCreditLimit(currentRecord, flTotal, FL_OLD_TOTAL);

    if (!bReturn) return false;

    //Check InGroup Processing
    var intLineCount = currentRecord.getLineCount({
      sublistId: "item",
    });

    var isApplyReprice = currentRecord.getValue(
      lib.TRANS_BODY_FLDS.FLD_IS_APPLY_REPRICE
    );
    var isItemGroup = false;

    for (var i = 0; i < intLineCount; i++) {
      //Item Type
      var stItemType = currentRecord.getSublistValue({
        sublistId: "item",
        fieldId: "itemtype",
        line: i,
      });

      if (stItemType == "Group" || stItemType == "EndGroup") {
        continue;
      }

      var bInrgoup = currentRecord.getSublistValue({
        sublistId: "item",
        fieldId: "ingroup",
        line: i,
      });

      var wnzIngroup = currentRecord.getSublistValue({
        sublistId: "item",
        fieldId: "custcol_wnz_ingroup",
        line: i,
      });

      if (bInrgoup == "T") bInrgoup = true;

      if (bInrgoup == true && bInrgoup != wnzIngroup) {
        isItemGroup = true;
      }
    }

    if (isItemGroup || isApplyReprice) {
      applyRepricing();
    }

    return true;
  }

  //Condition for dialog.confirm
  function success(result) {
    thisResult = result;
    isConfirm = true;
    getNLMultiButtonByName("multibutton_submitter").onMainButtonClick(this);
    return true;
  }

  function failure(reason) {
    return false;
  }

  function calculateAmounts(currentRecord) {
    var recordType = currentRecord.type;
    // var fldName = context.fieldId;
    // var sublistName = context.sublistId;
    // var recordType = currentRecord.type;

    // if (sublistName == 'item') {
    //Item Type
    var stItemType = currentRecord.getCurrentSublistValue({
      sublistId: "item",
      fieldId: "itemtype",
    });

    if (stItemType == "Group" || stItemType == "EndGroup") {
      return true;
    }

    /* --------- Start Update -----------------*/

    //just compute tolerance - added Update Nesmar
    var flQty =
      parseFloat(
        currentRecord.getCurrentSublistValue({
          sublistId: "item",
          fieldId: "quantity",
        })
      ) || 0;
    var flTolerance =
      parseFloat(
        currentRecord.getCurrentSublistValue({
          sublistId: "item",
          fieldId: "custcol_wnz_tolerance",
        })
      ) || 0;

    var flToleranceLine = (flTolerance / 100) * flQty;
    currentRecord.setCurrentSublistValue(
      "item",
      "custcol_wnz_tolerance_line",
      format.parse({ value: flToleranceLine, type: format.Type.CURRENCY })
    );

    //compute also the estimated cost
    var costRate =
      parseFloat(
        currentRecord.getCurrentSublistValue({
          sublistId: "item",
          fieldId: "costestimaterate",
        })
      ) || 0;
    currentRecord.setCurrentSublistValue(
      "item",
      "costestimate",
      format.parse({ value: flQty * costRate, type: format.Type.CURRENCY })
    );
    /*--------------- END UPDATE-------------------------*/

    //WNZ-172
    var stGrossNetInd = currentRecord.getCurrentSublistValue({
      sublistId: "item",
      fieldId: lib.TRANS_LINE_FLDS.GROSS_NETT_IND,
    });
    console.log("stGrossNetInd", stGrossNetInd)
    if (lib.GROSSNET.NETT == stGrossNetInd) {
      //calculate the new balance per Contracts
      calContracts(currentRecord);

      var flBasePrice = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.BASE_PRICE,
      });

      var intQty = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: "quantity",
      });

      var stPriceFactor = currentRecord.getCurrentSublistText({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.FLD_PRICE_FACTOR,
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
      console.log("flPriceFactor", flPriceFactor)
      console.log("flBasePrice", flBasePrice)
			if (recordType == 'salesorder' || recordType == 'estimate'){
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

      var finalAmount = roundup(unitPrice * intQty, 3);
      //var finalAmount = (unitPrice * intQty).toFixed(3);

      // Set the Discounted Rate to the "Wentzel Rate" field
      currentRecord.setCurrentSublistValue(
        "item",
        lib.TRANS_LINE_FLDS.FLD_WENTZEL_RATE,
        flBasePrice
      );
      console.log("unitPrice", unitPrice)
      currentRecord.setCurrentSublistValue("item", "rate", unitPrice);
      currentRecord.setCurrentSublistValue(
        "item",
        "amount",
        unitPrice * intQty,
        false,
        false
      );

      //Start 05/01/2019
      resetDiscountLines(currentRecord);
      computeTotalDiscount(currentRecord);
      //End 05/01/2019

      return true;
    }
    //End WNZ-172

    // if the Basket Discount Indicator is true, set the Apply Basket
    var isBasket = currentRecord.getCurrentSublistValue({
      sublistId: "item",
      fieldId: lib.TRANS_LINE_FLDS.FLD_BASKET_DISC_IND,
    });

    if (isBasket) {
      currentRecord.setValue({
        fieldId: lib.TRANS_BODY_FLDS.FLD_IS_APPLY_REPRICE,
        value: true,
        ignoreFieldChange: true,
      });
    }

    var flBasePrice = parseFloat(
      currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.BASE_PRICE,
      })
    );
    var flLineDisc = currentRecord.getCurrentSublistValue({
      sublistId: "item",
      fieldId: lib.TRANS_LINE_FLDS.FLD_LINE_DISC,
    });
    var flPromoDisc = currentRecord.getCurrentSublistValue({
      sublistId: "item",
      fieldId: lib.TRANS_LINE_FLDS.FLD_PROMO_DISC,
    });
    var flBasketDisc = currentRecord.getCurrentSublistValue({
      sublistId: "item",
      fieldId: lib.TRANS_LINE_FLDS.FLD_BASKET_DISC,
    });
    // var flTotalDiscounts = currentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: "custcol_wnz_total_discount" });

    var isSetRate = false;
    var discountedPrice = flBasePrice;
    var lineDiscounted = flBasePrice;
    var promoDiscounted = flBasePrice;
    var basketDiscounted;

    if (parseInt(flBasePrice) == 0) {
      discountedPrice = 0;
      isSetRate = true;
    }

    if (lib.convNull(flBasePrice) != "" && flBasePrice > 0) {
      if (lib.convNull(flLineDisc) == "") {
        flLineDisc = 0;
      }

      if (lib.convNull(flPromoDisc) == "") {
        flPromoDisc = 0;
      }

      if (lib.convNull(flBasketDisc) == "") {
        flBasketDisc = 0;
      }

      var stLineDiscType = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.FLD_LD_TYPE,
      });

      if (stLineDiscType == lib.DISCOUNT_TYPE.PERCENT) {
        // 1 is percent
        lineDiscounted = flBasePrice - flBasePrice * (flLineDisc / 100);
      }

      if (
        stLineDiscType == lib.DISCOUNT_TYPE.FIXED_RATE ||
        stLineDiscType == lib.DISCOUNT_TYPE.FIXED_RATE_EU
      ) {
        // 2 is fixed rate
        lineDiscounted = flBasePrice - flLineDisc;
      }

      //discountedPrice = roundup(lineDiscounted, 3);
      discountedPrice = parseFloat(lineDiscounted, 3);

      var stPromoDiscType = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.FLD_PROMO_DISC_TYPE,
      });

      if (stPromoDiscType == lib.DISCOUNT_TYPE.PERCENT) {
        // 1 is percentage
        promoDiscounted = lineDiscounted - lineDiscounted * (flPromoDisc / 100);
      }

      if (
        stPromoDiscType == lib.DISCOUNT_TYPE.FIXED_RATE ||
        stPromoDiscType == lib.DISCOUNT_TYPE.FIXED_RATE_EU
      ) {
        // 2 is fixed rate
        promoDiscounted = lineDiscounted - flPromoDisc;
      }

      discountedPrice = parseFloat(promoDiscounted, 3);

      var stBasketDiscType = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.FLD_BASKET_DISC_TYPE,
      });

      basketDiscounted = promoDiscounted - flBasketDisc;

      if (stBasketDiscType == lib.DISCOUNT_TYPE.PERCENT) {
        // 1 is percentage
        // var flTotalDiscounts = parseFloat(parseFloat(flLineDisc)+parseFloat(flPromoDisc)+parseFloat(flBasketDisc)).toFixed(1);
        var discountedPrice =
          flBasePrice -
          flBasePrice *
            (parseFloat(parseFloat(flLineDisc) + parseFloat(flBasketDisc)) /
              100);
        basketDiscounted =
          discountedPrice - discountedPrice * (parseFloat(flPromoDisc) / 100);
        // basketDiscounted = (flBasePrice - (flBasePrice * (flTotalDiscounts / 100)));
      }

      if (
        stBasketDiscType == lib.DISCOUNT_TYPE.FIXED_RATE ||
        stBasketDiscType == lib.DISCOUNT_TYPE.FIXED_RATE_EU
      ) {
        // 2 is fixed rate
        basketDiscounted = promoDiscounted - flBasketDisc;
      }

      discountedPrice = parseFloat(toFixed(basketDiscounted, 5));
      isSetRate = true;
    }

    if (isSetRate) {
      //Set the value for Curnet ld, pd, and bt columns
      currentRecord.setCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.FLD_CURNET_LD,
        value: lineDiscounted,
        ignoreFieldChange: true,
      });

      currentRecord.setCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.FLD_CURNET_PD,
        value: promoDiscounted,
        ignoreFieldChange: true,
      });

      currentRecord.setCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.FLD_CURNET_BT,
        value: basketDiscounted,
        ignoreFieldChange: true,
      });

      // Set the Discounted Rate to the "Wentzel Rate" field
      currentRecord.setCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.FLD_WENTZEL_RATE,
        value: discountedPrice,
        ignoreFieldChange: true,
      });

      var intMaterialGroup = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: 'custcol_wnz_main_group_code',
      });

      var stPriceFactor = currentRecord.getCurrentSublistText({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.FLD_PRICE_FACTOR,
      });

      if (stPriceFactor == "" || stPriceFactor == null) {
        stPriceFactor = "1";
      }

      var flPriceFactor = parseFloat(stPriceFactor.replace(',', '.'));

      if (recordType == 'salesorder' || recordType == 'estimate'){
        if (intMaterialGroup == 63) {
          var unitPrice = discountedPrice * flPriceFactor;
          console.log("MAT unitPrice", unitPrice)
        } else {
          var unitPrice = discountedPrice / flPriceFactor;
          console.log("NOT MAT unitPrice", unitPrice)
        }
      } else {
        var unitPrice = discountedPrice / flPriceFactor;
        console.log("discountedPrice " + discountedPrice);
        console.log("flPriceFactor " + flPriceFactor);
        console.log("UNit Price set here" + discountedPrice / flPriceFactor);
      }				

      currentRecord.setCurrentSublistValue({
        sublistId: "item",
        fieldId: "rate",
        value: unitPrice,
        ignoreFieldChange: true,
      });
    }

    //calculate the new balance per Contracts
    calContracts(currentRecord);

    var stRate = currentRecord.getCurrentSublistText({
      sublistId: "item",
      fieldId: "rate",
    });

    if (!stRate) stRate = 0;
    console.log(stRate);
    var flRate = format.parse({ value: stRate, type: format.Type.CURRENCY });

    // Set the Final Amount
    // Deduct the Balance from the Contract
    var intQty = currentRecord.getCurrentSublistValue({
      sublistId: "item",
      fieldId: "quantity",
    });
    console.log("amount to set " + flRate * intQty);

    /*var finalAmount = roundup((flRate * intQty), 3);
            console.log(finalAmount);*/
    //var finalAmount = (flRate * intQty).toFixed(3);

    currentRecord.setCurrentSublistValue(
      "item",
      "amount",
      flRate * intQty,
      false,
      false
    );
    computeTotalDiscount(currentRecord);

    // }
  }

  function applyRepricing() {
    debugger;

    var objCurrRec = currentRec.get();
    var intLineCount = objCurrRec.getLineCount({ sublistId: "item" });

    //Loop Item Grp Pricing
    // for (var x = 0; x < intLineCount; x++)
    // {
    //     objCurrRec.selectLine({ sublistId: 'item', line: x });
    //
    //     log.debug("ITEM", objCurrRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'item' }));
    //
    //     //Item Type
    //     var stItemType = objCurrRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'itemtype' });
    //     if(stItemType == 'Group' ||  stItemType == 'EndGroup') {
    //         continue;
    //     }
    //
    //     var bInrgoup = objCurrRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'ingroup', });
    //
    //     if(bInrgoup == 'T' || bInrgoup == true) {
    //         objCurrRec.selectLine({ sublistId: 'item', line: x });
    //
    //         var stIemBasePrice = objCurrRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_wnz_item_base_price' });
    //         var stBasePrice = objCurrRec.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_wnz_ocp_base_price' });
    //
    //         if(!stBasePrice) {
    //             objCurrRec.setCurrentSublistValue({ sublistId:  'item', fieldId: 'custcol_wnz_ocp_base_price', value: stIemBasePrice, ignoreFieldChange: true});
    //         }
    //
    //         checkDiscount(objCurrRec);
    //         computeTotalDiscount(objCurrRec);
    //
    //         //NATO | 02/10/2020 | Removed
    //         //  calContractsOnLine(x, objCurrRec);
    //
    //         objCurrRec.commitLine({ sublistId: 'item' });
    //     }
    // }

    bIsBasketPricing = true;
    var jsonBasketGroup = {};
    var arrMatGrp = [];
    var arrMainGrp = [];
    var blIsMainGroup = false;
    var bHaveBasket = false;
    //Loop Basket Discount
    for (var x = 0; x < intLineCount; x++) {
      //Item Type
      var stItemType = objCurrRec.getSublistValue({
        sublistId: "item",
        fieldId: "itemtype",
        line: x,
      });

      if (stItemType == "Group" || stItemType == "EndGroup") {
        continue;
      }

      var stIsBasketDiscInd = objCurrRec.getSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.FLD_BASKET_DISC_IND,
        line: x,
      });
      var intQty =
        parseFloat(
          objCurrRec.getSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            line: x,
          })
        ) || 0;

      if (stIsBasketDiscInd == "T" || stIsBasketDiscInd == true) {
        var stMatGroup = objCurrRec.getSublistValue({
          sublistId: "item",
          fieldId: lib.TRANS_LINE_FLDS.FLD_MAT_GRP,
          line: x,
        });
        var stMainGroup = objCurrRec.getSublistValue({
          sublistId: "item",
          fieldId: "custcol_wnz_main_group_code",
          line: x,
        });

        if (stMainGroup != "") {
          /** Main Group **/
          if (!lib.inArray(arrMainGrp, stMainGroup)) {
            arrMainGrp.push(stMainGroup);
          }

          if (!jsonBasketGroup[stMainGroup] && stMainGroup) {
            jsonBasketGroup[stMainGroup] = 0;
            bHaveBasket = true;
          }

          blIsMainGroup = true;
          jsonBasketGroup[stMainGroup] += intQty;
        } else {
          /** Material Group **/
          if (!lib.inArray(arrMatGrp, stMatGroup)) {
            arrMatGrp.push(stMatGroup);
          }

          if (!jsonBasketGroup[stMatGroup] && stMatGroup) {
            jsonBasketGroup[stMatGroup] = 0;
            bHaveBasket = true;
          }

          jsonBasketGroup[stMatGroup] += intQty;
        }
      }
    }

    log.debug("jsonBasketGroup", jsonBasketGroup);

    if (blIsMainGroup) {
      if (arrMainGrp.length == 0 || !bHaveBasket) {
        dialog
          .alert({
            title: "No Basket Discount",
            message: "No lines applicable for Basket Discount.",
          })
          .then(lib.alertSuccess)
          .catch(lib.alertFailure);

        bIsBasketPricing = false;
        return;
      }
    } else {
      if (arrMatGrp.length == 0 || !bHaveBasket) {
        dialog
          .alert({
            title: "No Basket Discount",
            message: "No lines applicable for Basket Discount.",
          })
          .then(lib.alertSuccess)
          .catch(lib.alertFailure);

        bIsBasketPricing = false;
        return;
      }
    }

    lib.showMantle("Applying repricing.. Please wait.");
    setTimeout(function () {
      lib.hideMantle();
    }, 300);

    var objBasketGroup = {};
    var customerConditions = objCurrRec.getValue({fieldId: 'custbody_wnz_customer_conditions'});
    var cust = (customerConditions == '') ? objCurrRec.getValue("entity") : customerConditions;
    if (blIsMainGroup) {
      for (var group in jsonBasketGroup) {
        if (!group) continue;
        var dtPriceDate = new Date(
          objCurrRec.getValue("custbody_wnz_price_date")
        );
        var stPriceDate = format.format({
          value: dtPriceDate,
          type: format.Type.DATE,
        });
        var objParameter = {
          group: group,
          entity: cust,
          stPriceDate: stPriceDate,
          totalquantity: parseFloat(jsonBasketGroup[group]),
        };

        objBasketGroup[group] = getMainGroupDiscount(objParameter);
      }
    } else {
      for (var group in jsonBasketGroup) {
        if (!group) continue;

        var dtPriceDate = new Date(
          objCurrRec.getValue("custbody_wnz_price_date")
        );
        var stPriceDate = format.format({
          value: dtPriceDate,
          type: format.Type.DATE,
        });

        var arrFilters = [
          [
            "custrecord_ocp_discount_customer",
            "anyof",
            cust,
          ],
          "and",
          ["custrecord_ocp_discount_item_group", "anyof", group],
          "and",
          [
            "custrecord_ocp_threshold",
            "lessthanorequalto",
            parseFloat(jsonBasketGroup[group]),
          ],
          "and",
          ["custrecord_ocp_discount_adjustment_type", "anyof", "3"],
          "and",
          ["custrecord_ocp_date_from", "onorbefore", stPriceDate],
          "and",
          [
            ["custrecord_ocp_date_to", "onorafter", stPriceDate],
            "or",
            ["custrecord_ocp_date_to", "isEmpty", "@NONE"],
          ],
        ];

        var arrResult = lib.runSearch(
          search,
          null,
          SEARCH_PRICING_DISCOUNT,
          arrFilters
        );

        arrResult.each(function (objResult) {
          var sttItemGrp = objResult.getValue(
            "custrecord_ocp_discount_item_group"
          );
          objBasketGroup[sttItemGrp] = lib.forceFloat(
            objResult.getValue("custrecord_ocp_discount_value")
          );
        });
      }
    }

    console.log("objBasketGroup", objBasketGroup);

    for (var y = 0; y < intLineCount; y++) {
      //Item Type
      var stItemType = objCurrRec.getSublistValue({
        sublistId: "item",
        fieldId: "itemtype",
        line: y,
      });
      if (stItemType == "Group" || stItemType == "EndGroup") {
        continue;
      }

      var bInrgoup = objCurrRec.getCurrentSublistValue({
        sublistId: "item",
        fieldId: "ingroup",
      });

      // if(bInrgoup == 'T' || bInrgoup == true) {
      objCurrRec.selectLine({ sublistId: "item", line: y });

      var stIemBasePrice = objCurrRec.getCurrentSublistValue({
        sublistId: "item",
        fieldId: "custcol_wnz_item_base_price",
      });
      var stBasePrice = objCurrRec.getCurrentSublistValue({
        sublistId: "item",
        fieldId: "custcol_wnz_ocp_base_price",
      });

      if (!stBasePrice) {
        objCurrRec.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "custcol_wnz_ocp_base_price",
          value: stIemBasePrice,
          ignoreFieldChange: true,
        });
      }

      checkDiscount(objCurrRec);
      computeTotalDiscount(objCurrRec);
      // }

      //WNZ-172
      var stGrossNetInd = objCurrRec.getSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.GROSS_NETT_IND,
        line: y,
      });

      if (lib.GROSSNET.NETT == stGrossNetInd) {
        continue;
      }
      //END WNZ-172

      var stIsBasketDiscInd = objCurrRec.getSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.FLD_BASKET_DISC_IND,
        line: y,
      });
      if (stIsBasketDiscInd == "T" || stIsBasketDiscInd == true) {
        var stMatGroup = objCurrRec.getSublistValue({
          sublistId: "item",
          fieldId: lib.TRANS_LINE_FLDS.FLD_MAT_GRP,
          line: y,
        });
        var stMainGroup = objCurrRec.getSublistValue({
          sublistId: "item",
          fieldId: "custcol_wnz_main_group_code",
          line: y,
        });
        objCurrRec.selectLine({ sublistId: "item", line: y });
        if (stMainGroup) {
          if (objBasketGroup[stMainGroup]) {
            var blRateManuallyChanged = objCurrRec.getCurrentSublistValue({
              sublistId: "item",
              fieldId: "custcol_wnz_ocp_manually_changed",
            });
            if (blRateManuallyChanged) {
              objCurrRec.setCurrentSublistValue({
                sublistId: "item",
                fieldId: lib.TRANS_LINE_FLDS.FLD_BASKET_DISC,
                value: "",
              });
              objCurrRec.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "custcol_wnz_total_discount",
                value: "",
              });
            } else {
              var basketDiscount = objBasketGroup[stMainGroup];
              objCurrRec.setCurrentSublistValue({
                sublistId: "item",
                fieldId: lib.TRANS_LINE_FLDS.FLD_BASKET_DISC,
                value: basketDiscount,
              });
            }
          } else {
            objCurrRec.setCurrentSublistValue({
              sublistId: "item",
              fieldId: lib.TRANS_LINE_FLDS.FLD_BASKET_DISC,
              value: 0,
            });
          }
        } else {
          if (objBasketGroup[stMatGroup]) {
            var blRateManuallyChanged = objCurrRec.getCurrentSublistValue({
              sublistId: "item",
              fieldId: "custcol_wnz_ocp_manually_changed",
            });
            if (blRateManuallyChanged) {
              objCurrRec.setCurrentSublistValue({
                sublistId: "item",
                fieldId: lib.TRANS_LINE_FLDS.FLD_BASKET_DISC,
                value: "",
              });
              objCurrRec.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "custcol_wnz_total_discount",
                value: "",
              });
            } else {
              var basketDiscount = objBasketGroup[stMatGroup];
              objCurrRec.setCurrentSublistValue({
                sublistId: "item",
                fieldId: lib.TRANS_LINE_FLDS.FLD_BASKET_DISC,
                value: basketDiscount,
              });
            }
          } else {
            objCurrRec.setCurrentSublistValue({
              sublistId: "item",
              fieldId: lib.TRANS_LINE_FLDS.FLD_BASKET_DISC,
              value: 0,
            });
          }
        }

        // calculateAmounts(objCurrRec);
        objCurrRec.commitLine({ sublistId: "item" });
      }
    }

    var isApplyReprice = objCurrRec.getValue(
      lib.TRANS_BODY_FLDS.FLD_IS_APPLY_REPRICE
    );
    if (isApplyReprice) {
      // set the Apply Basket Repricing flag to false
      objCurrRec.setValue({
        fieldId: lib.TRANS_BODY_FLDS.FLD_IS_APPLY_REPRICE,
        value: false,
        ignoreFieldChange: true,
      });
    }

    bIsBasketPricing = false;
  }

  function calContracts(currentRecord) {
    if (bIsBasketPricing) return;

    //NATO | 02/06/2020 | get WNZ OCP Sales Promotion; if true, exit this process
    var bIsSalesPromo = currentRecord.getCurrentSublistValue({
      sublistId: "item",
      fieldId: "custcol_wnz_ocp_sales_promotion",
    });
    if (bIsSalesPromo == "T" || bIsSalesPromo == true) {
      return;
    }

    var currLine = currentRecord.getCurrentSublistIndex("item");
    var jsonLine = {};
    var jsonValue = currentRecord.getValue(lib.TRANS_BODY_FLDS.JSON_LINE);

    if (lib.convNull(jsonValue) != "") {
      if (JSON.stringify(jsonValue) != "{}") jsonLine = JSON.parse(jsonValue);
    }

    if (JSON.stringify(jsonLine) != "{}") {
      var currQty = 0;

      //getting the unit
      var uom = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_UNIT,
        line: currLine,
      });

      if (uom == lib.UNIT.KG) {
        currQty += Number(
          currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.TOTAL_WEIGHT_BASE,
            line: currLine,
          })
        );

        if (currQty == 0) {
          var intQty = Number(
            currentRecord.getCurrentSublistValue({
              sublistId: "item",
              fieldId: "quantity",
            })
          );

          var flWgtPerBaseUnit = Number(
            currentRecord.getCurrentSublistValue({
              sublistId: "item",
              fieldId: lib.TRANS_LINE_FLDS.WEIGHT_PER_UNIT,
            })
          );

          currQty = intQty * flWgtPerBaseUnit;
        }
      } else {
        currQty += Number(
          currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            line: currLine,
          })
        );
      }

      var prvQty = Number(
        currentRecord.getCurrentSublistValue({
          sublistId: "item",
          fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
          line: currLine,
        })
      );

      var itemVolContract = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_CONTRACT,
        line: currLine,
      });
      var contractId = 0;
      var contractName = "";

      contractId = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.CONTRACT_REF_KEY,
        line: currLine,
      });

      //if (itemVolContract == true || itemVolContract == 'T') {

      contractName = currentRecord.getCurrentSublistText({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.CONTRACT_REF_KEY,
        line: currLine,
      });

      /**} else {

                contractName = currentRecord.getCurrentSublistText({
                    sublistId: 'item',
                    fieldId: lib.TRANS_LINE_FLDS.CONTRACT_HEADER,
                    line: currLine
                });
            }
                 **/

      var stHeader = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.CONTRACT_HEADER,
        line: currLine,
      });

      //get accumulated qty per contract
      var lineCnt = currentRecord.getLineCount("item");
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
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_UNIT,
            line: cnt,
          });

          //getting the item volume contract
          var ivCont = currentRecord.getSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_CONTRACT,
            line: cnt,
          });
          var cId = currentRecord.getSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.CONTRACT_REF_KEY,
            line: cnt,
          });

          var stHeaderLine = currentRecord.getSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.CONTRACT_HEADER,
            line: cnt,
          });

          if (itemVolContract == true || itemVolContract == "T") {
            if (cId != contractId) {
              continue;
            }
          } else {
            if (stHeader != stHeaderLine) {
              continue;
            }
          }

          var intQty = Number(
            currentRecord.getSublistValue({
              sublistId: "item",
              fieldId: "quantity",
              line: cnt,
            })
          );

          //Check the unit if KG then get TOTAL WEIGHT BASE else quantity
          if (ivUnit == lib.UNIT.KG) {
            totalQty += Number(
              currentRecord.getSublistValue({
                sublistId: "item",
                fieldId: lib.TRANS_LINE_FLDS.TOTAL_WEIGHT_BASE,
                line: cnt,
              })
            );

            if (totalQty == 0) {
              var flWgtPerBaseUnit = Number(
                currentRecord.getSublistValue({
                  sublistId: "item",
                  fieldId: lib.TRANS_LINE_FLDS.WEIGHT_PER_UNIT,
                  line: cnt,
                })
              );

              totalQty = intQty * flWgtPerBaseUnit;
            }
          } else {
            totalQty += Number(
              currentRecord.getSublistValue({
                sublistId: "item",
                fieldId: "quantity",
                line: cnt,
              })
            );
          }

          prevQty += Number(
            currentRecord.getSublistValue({
              sublistId: "item",
              fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
              line: cnt,
            })
          );
        }
        totalQty += currQty;
        // prevQty += prvQty;
      } else {
        totalQty += currQty;
      }

      //validate the JSON field  and set the new balance quantity;
      // if (prevQty == totalQty) {
      // return;  // NATO | 1/2/2020 | Removed so when setting the back to original value the alert notification will still work
      // }

      var newValue = 0;
      if (jsonLine[contractId]) {
        var jsonQty = jsonLine[contractId].balanceQty;
        var jsonNewQty = jsonLine[contractId].newBalanceQty;

        // if(jsonNewQty != undefined)
        // {
        //     if (prevQty != totalQty) {
        //         jsonQty = jsonNewQty;
        //     }

        // }

        var hdr = jsonLine[contractId].hdr;
        if (totalQty > 0) {
          //check if there is any changes
          // if (prevQty != totalQty) {
          //     newValue = Number(jsonQty) + Number(prevQty - totalQty);

          // } else {
          //         newValue = Number(jsonQty) - Number(totalQty);
          //         // newValue = Number(jsonQty);
          // }

          var bIsInGroup = currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "ingroup",
          });

          var lineCnt = currentRecord.getLineCount("item");

          var intPrevQty = Number(
            currentRecord.getCurrentSublistValue({
              sublistId: "item",
              fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
            })
          );

          var intCurrQty = Number(
            currentRecord.getCurrentSublistValue({
              sublistId: "item",
              fieldId: "quantity",
            })
          );

          if (uom == lib.UNIT.KG) {
            intCurrQty = Number(
              currentRecord.getCurrentSublistValue({
                sublistId: "item",
                fieldId: lib.TRANS_LINE_FLDS.TOTAL_WEIGHT_BASE,
              })
            );
          }

          if (OLD_QUANTITY == intCurrQty) {
            if (intPrevQty != 0) {
              return;
            }
          }

          if (bIsInGroup.toUpperCase() == "T") {
            if (CONTEXT_MODE == "create") {
              newValue = Number(jsonNewQty) - Number(intCurrQty);
              if (isNaN(newValue)) {
                newValue = Number(jsonQty) - Number(intCurrQty);
              }
            } else {
              if (parseInt(OLD_QUANTITY) != 0) {
                newValue = Number(jsonNewQty) + Number(intPrevQty - intCurrQty);
                if (isNaN(newValue)) {
                  newValue = Number(jsonQty) + Number(intPrevQty - intCurrQty);
                }
              } else {
                newValue = Number(jsonNewQty) - Number(intCurrQty);
                if (isNaN(newValue)) {
                  newValue = Number(jsonQty) - Number(intCurrQty);
                }
              }
            }
          } else {
            if (lineCnt > 1) {
              if (Number(intCurrQty - intPrevQty) == 0) {
                newValue = Number(jsonNewQty) - Number(intCurrQty);
                if (isNaN(newValue)) {
                  newValue = Number(jsonQty) - Number(intCurrQty);
                }
              } else {
                if (OLD_QUANTITY != 0) {
                  newValue =
                    Number(jsonNewQty) + Number(intPrevQty - intCurrQty);
                  if (isNaN(newValue)) {
                    newValue =
                      Number(jsonQty) + Number(intPrevQty - intCurrQty);
                  }
                } else {
                  newValue = Number(jsonNewQty) - Number(intCurrQty);
                  if (isNaN(newValue)) {
                    newValue = Number(jsonQty) - Number(intCurrQty);
                  }
                }
              }
            } else {
              if (Number(intCurrQty - intPrevQty) == 0) {
                newValue = Number(jsonNewQty) - Number(intCurrQty);
                if (isNaN(newValue)) {
                  newValue = Number(jsonQty) - Number(intCurrQty);
                }
              } else {
                if (OLD_QUANTITY != 0) {
                  newValue =
                    Number(jsonNewQty) + Number(intPrevQty - intCurrQty);

                  if (isNaN(newValue)) {
                    newValue =
                      Number(jsonQty) + Number(intPrevQty - intCurrQty);
                  }
                } else {
                  newValue = Number(jsonNewQty) - Number(intCurrQty);
                  if (isNaN(newValue)) {
                    newValue = Number(jsonQty) - Number(intCurrQty);
                  }
                }
              }
            }
          }

          var bHasContract = currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.CONTRACT_REF_KEY,
          });

          // if(intPrevQty == '' || intPrevQty == null)
          // {
          if (bHasContract) {
            var stVolUOM = currentRecord.getCurrentSublistValue({
              sublistId: "custpage_sublist",
              fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_UNIT,
            });

            if (stVolUOM == lib.UNIT.KG) {
              intCurrQty = Number(
                currentRecord.getCurrentSublistValue({
                  sublistId: "item",
                  fieldId: lib.TRANS_LINE_FLDS.TOTAL_WEIGHT_BASE,
                })
              );

              currentRecord.setCurrentSublistValue({
                sublistId: "item",
                fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
                value: intCurrQty,
              });
            } else {
              currentRecord.setCurrentSublistValue({
                sublistId: "item",
                fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
                value: intCurrQty,
              });
            }

            // if(parseFloat(jsonLine[contractId].newBalanceQty) != parseFloat(newValue.toFixed(2)))
            // {

            //         currentRecord.setCurrentSublistValue({
            //             sublistId: 'item',
            //             fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
            //             value: parseFloat(jsonLine[contractId].balanceQty) - parseFloat(newValue.toFixed(2))
            //         });

            // }
            // else
            // {
            //     currentRecord.setCurrentSublistValue({
            //         sublistId: 'item',
            //         fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
            //         value: parseFloat(jsonLine[contractId].balanceQty) - parseFloat(newValue.toFixed(2))
            //     });
            // }
          }
          // }

          if (jsonLine[contractId].newBalanceQty == null) {
            jsonLine[contractId] = {
              balanceQty: jsonQty,
              newBalanceQty: newValue.toFixed(2),
              hdr: hdr,
            };
          } else {
            jsonLine[contractId].newBalanceQty = newValue.toFixed(2);
          }

          //update balance of the rest of contract line with same header
          if (jsonLine[contractId].hdr) {
            for (var intCtrJson in jsonLine) {
              if (jsonLine[intCtrJson].hdr == jsonLine[contractId].hdr) {
                jsonLine[intCtrJson].newBalanceQty =
                  jsonLine[contractId].newBalanceQty;
              }
            }
          }

          //update the json field
          currentRecord.setValue(
            lib.TRANS_BODY_FLDS.JSON_LINE,
            JSON.stringify(jsonLine),
            false
          );

          //Start - Alert "New Balance of <Contract Name> is <Balance from JSON file>"  MJ-02/11/2019
          dialog.alert({
            title: "Information",
            message:
              "New Balance of " +
              contractName +
              " is " +
              jsonLine[contractId].newBalanceQty,
          });
          //End - Alert "New Balance of <Contract Name> is <Balance from JSON file>"  MJ-02/11/2019
        }
      }
    }
  }

  function getMainGroupDiscount(objParameter) {
    var flDiscRate = "";
    var customrecord_wnz_ocp_pricing_discountSearchObj = search.create({
      type: "customrecord_wnz_ocp_pricing_discount",
      filters: [
        ["custrecord_ocp_discount_adjustment_type", "anyof", "3"],
        "AND",
        ["custrecord_ocp_discount_main_group", "anyof", objParameter.group],
        "AND",
        ["custrecord_ocp_discount_customer", "anyof", objParameter.entity],
        "AND",
        [
          "custrecord_ocp_threshold",
          "lessthanorequalto",
          objParameter.totalquantity,
        ],
        "AND",
        ["custrecord_ocp_date_from", "onorbefore", objParameter.stPriceDate],
        "AND",
        [
          ["custrecord_ocp_date_to", "onorafter", objParameter.stPriceDate],
          "OR",
          ["custrecord_ocp_date_to", "isEmpty", "@NONE"],
        ],
      ],
      columns: [
        search.createColumn({
          name: "custrecord_ocp_discount_customer",
          label: "Customer",
        }),
        search.createColumn({
          name: "custrecord_ocp_discount_item_group",
          label: "Item Group",
        }),
        search.createColumn({
          name: "custrecord_ocp_discount_adjustment_type",
          label: "Adjustment Type",
        }),
        search.createColumn({
          name: "custrecord_ocp_discount_item",
          label: "Item",
        }),
        search.createColumn({
          name: "custrecord_ocp_threshold",
          sort: search.Sort.DESC,
          label: "Threshold",
        }),
        search.createColumn({
          name: "custrecord_ocp_date_from",
          label: "Date From",
        }),
        search.createColumn({
          name: "custrecord_ocp_date_to",
          label: "Date To",
        }),
        search.createColumn({
          name: "custrecord_wnz_discount_rule_item",
          label: "Discount Rule",
        }),
        search.createColumn({
          name: "custrecord_ocp_discount_value",
          label: "Discount Value",
        }),
        search.createColumn({
          name: "custrecord_ocp_discount_main_group",
          label: "Main Group",
        }),
      ],
    });
    var searchResultCount =
      customrecord_wnz_ocp_pricing_discountSearchObj.runPaged().count;

    if (searchResultCount != 0) {
      customrecord_wnz_ocp_pricing_discountSearchObj
        .run()
        .each(function (result) {
          flDiscRate = result.getValue({
            name: "custrecord_ocp_discount_value",
          });
          return false;
        });
    }

    return flDiscRate;
  }

  function calContractsOnLine(currentLine, objCurrRec) {
    if (bIsBasketPricing) return;

    //debugger;
    var currentRecord = objCurrRec;
    var currLine = currentLine;
    var jsonLine = {};
    var jsonValue = currentRecord.getValue(lib.TRANS_BODY_FLDS.JSON_LINE);

    if (lib.convNull(jsonValue) != "") {
      if (JSON.stringify(jsonValue) != "{}") jsonLine = JSON.parse(jsonValue);
    }

    if (JSON.stringify(jsonLine) != "{}") {
      var currQty = 0;
      currentRecord.selectLine({ sublistId: "item", line: currLine });

      //getting the unit
      var uom = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_UNIT,
      });

      if (uom == lib.UNIT.KG) {
        currQty += Number(
          currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.TOTAL_WEIGHT_BASE,
          })
        );

        if (currQty == 0) {
          var intQty = Number(
            currentRecord.getCurrentSublistValue({
              sublistId: "item",
              fieldId: "quantity",
            })
          );

          var flWgtPerBaseUnit = Number(
            currentRecord.getCurrentSublistValue({
              sublistId: "item",
              fieldId: lib.TRANS_LINE_FLDS.WEIGHT_PER_UNIT,
            })
          );

          currQty = intQty * flWgtPerBaseUnit;
        }
      } else {
        currQty += Number(
          currentRecord.getCurrentSublistValue({
            sublistId: "item",
            fieldId: "quantity",
          })
        );
      }

      var prvQty = Number(
        currentRecord.getCurrentSublistValue({
          sublistId: "item",
          fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
        })
      );

      var itemVolContract = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_CONTRACT,
      });
      var contractId = 0;
      var contractName = "";

      contractId = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.CONTRACT_REF_KEY,
      });

      //if (itemVolContract == true || itemVolContract == 'T') {

      contractName = currentRecord.getCurrentSublistText({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.CONTRACT_REF_KEY,
      });

      /**} else {

                contractName = currentRecord.getCurrentSublistText({
                    sublistId: 'item',
                    fieldId: lib.TRANS_LINE_FLDS.CONTRACT_HEADER,
                    line: currLine
                });
            }
                 **/

      var stHeader = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: lib.TRANS_LINE_FLDS.CONTRACT_HEADER,
      });

      //get accumulated qty per contract
      var lineCnt = currentRecord.getLineCount("item");
      var totalQty = 0;
      var prevQty = 0;
      if (lineCnt > 0) {
        for (var ii = 0; ii < lineCnt; ii++) {
          var cnt = ii;
          //check if the loop get the currLine
          if (currLine == cnt) {
            continue;
          }

          //getting the unit
          var ivUnit = currentRecord.getSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_UNIT,
            line: cnt,
          });

          //getting the item volume contract
          var ivCont = currentRecord.getSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_CONTRACT,
            line: cnt,
          });
          var cId = currentRecord.getSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.CONTRACT_REF_KEY,
            line: cnt,
          });

          var stHeaderLine = currentRecord.getSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.CONTRACT_HEADER,
            line: cnt,
          });

          if (itemVolContract == true || itemVolContract == "T") {
            if (cId != contractId) {
              continue;
            }
          } else {
            if (stHeader != stHeaderLine) {
              continue;
            }
          }

          //Check the unit if KG then get TOTAL WEIGHT BASE else quantity

          if (ivUnit == lib.UNIT.KG) {
            totalQty += Number(
              currentRecord.getSublistValue({
                sublistId: "item",
                fieldId: lib.TRANS_LINE_FLDS.TOTAL_WEIGHT_BASE,
                line: cnt,
              })
            );

            if (totalQty == 0) {
              var intQty = Number(
                currentRecord.getSublistValue({
                  sublistId: "item",
                  fieldId: "quantity",
                  line: cnt,
                })
              );

              var flWgtPerBaseUnit = Number(
                currentRecord.getSublistValue({
                  sublistId: "item",
                  fieldId: lib.TRANS_LINE_FLDS.WEIGHT_PER_UNIT,
                  line: cnt,
                })
              );

              totalQty = intQty * flWgtPerBaseUnit;
            }
          } else {
            totalQty += Number(
              currentRecord.getSublistValue({
                sublistId: "item",
                fieldId: "quantity",
                line: cnt,
              })
            );
          }

          prevQty += Number(
            currentRecord.getSublistValue({
              sublistId: "item",
              fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
              line: cnt,
            })
          );
        }
        totalQty += currQty;
        prevQty += prvQty;
      } else {
        totalQty += currQty;
      }

      //validate the JSON field  and set the new balance quantity;
      if (prevQty == totalQty) {
        return;
      }

      var newValue = 0;
      if (jsonLine[contractId]) {
        var jsonQty = jsonLine[contractId].balanceQty;
        var hdr = jsonLine[contractId].hdr;
        if (totalQty > 0) {
          //check if there is any changes
          if (prevQty != totalQty) {
            newValue = Number(jsonQty) + Number(prevQty - totalQty);
            // newValue = Number(jsonQty) + Number(totalQty);
          } else {
            newValue = Number(jsonQty) - Number(totalQty);
            // newValue = Number(jsonQty);
          }

          if (jsonLine[contractId].newBalanceQty == null) {
            jsonLine[contractId] = {
              balanceQty: jsonQty,
              newBalanceQty: newValue.toFixed(2),
              hdr: hdr,
            };
          } else {
            jsonLine[contractId].newBalanceQty = newValue.toFixed(2);
          }

          //update balance of the rest of contract line with same header
          if (jsonLine[contractId].hdr) {
            for (var intCtrJson in jsonLine) {
              if (jsonLine[intCtrJson].hdr == jsonLine[contractId].hdr) {
                jsonLine[intCtrJson].newBalanceQty =
                  jsonLine[contractId].newBalanceQty;
              }
            }
          }

          //update the json field
          currentRecord.setValue(
            lib.TRANS_BODY_FLDS.JSON_LINE,
            JSON.stringify(jsonLine),
            false
          );

          //Start - Alert "New Balance of <Contract Name> is <Balance from JSON file>"  MJ-02/11/2019
          // dialog.alert({
          // 	title : "Information",
          // 	message : 'New Balance of '+contractName+' is '+jsonLine[contractId].newBalanceQty
          // });
          //End - Alert "New Balance of <Contract Name> is <Balance from JSON file>"  MJ-02/11/2019
        }
      }
    }
  }

  function checkDiscount(currentRecord) {
    //debugger;

    // if(bIsBasketPricing) return;

    var currLine = currentRecord.getCurrentSublistIndex("item");

    var jsonLine = {};
    var jsonValue = currentRecord.getValue(lib.TRANS_BODY_FLDS.JSON_LINE);
    if (lib.convNull(jsonValue) != "") {
      if (JSON.stringify(jsonValue) != "{}") jsonLine = JSON.parse(jsonValue);
    }

    //WNZ-172
    var stGrossNetInd = currentRecord.getCurrentSublistValue({
      sublistId: "item",
      fieldId: lib.TRANS_LINE_FLDS.GROSS_NETT_IND,
    });

    //log.debug(lib.GROSSNET.NETT, stGrossNetInd);

    if (lib.GROSSNET.NETT == stGrossNetInd) {
      return;
    }
    //END WNZ-172

    lib.showMantle("Applying discount.. Please wait.");
    setTimeout(function () {
      lib.hideMantle();
    }, 300);

    var prevQty =
      parseFloat(
        currentRecord.getCurrentSublistValue({
          sublistId: "item",
          fieldId: lib.TRANS_LINE_FLDS.FLD_PREV_QUANTITY,
        })
      ) || 0;

    var currQty =
      parseFloat(
        currentRecord.getCurrentSublistValue({
          sublistId: "item",
          fieldId: "quantity",
        })
      ) || 0;

    var itemVolContract = currentRecord.getCurrentSublistValue({
      sublistId: "item",
      fieldId: lib.TRANS_LINE_FLDS.ITEM_VOL_CONTRACT,
    });

    var GNIndicator = currentRecord.getCurrentSublistValue({
      sublistId: "item",
      fieldId: lib.TRANS_LINE_FLDS.GROSS_NETT_IND,
    });

    var contractId = 0;
    var contractName = "";

    //GETTERS
    var objParam = {};
    objParam.stCustomer = currentRecord.getValue(
      "custbody_wnz_customer_conditions"
    );
    if (!objParam.stCustomer) {
      objParam.stCustomer = currentRecord.getValue("entity");
    }
    objParam.isGroupPrice = currentRecord.getCurrentSublistValue({
      sublistId: "item",
      fieldId: "custcol_wnz_item_group_pricing",
    });
    objParam.stQty = currentRecord.getCurrentSublistValue({
      sublistId: "item",
      fieldId: "quantity",
    });

    objParam.stPriceDate = currentRecord.getValue(
      lib.TRANS_BODY_FLDS.PRICE_DATE
    );
    var dDate = new Date(objParam.stPriceDate);
    var stDate = format.format({
      value: dDate,
      type: format.Type.DATE,
    });

    objParam.stItemGrp = currentRecord.getCurrentSublistValue({
      sublistId: "item",
      fieldId: lib.TRANS_LINE_FLDS.FLD_MAT_GRP,
    });

    objParam.stItem = currentRecord.getCurrentSublistValue({
      sublistId: "item",
      fieldId: "item",
    });

    // Inside WNZ_FieldChanged_Pricing function, upon changing the line Quantity (quantity), run the search:
    if (
      objParam.stCustomer &&
      (objParam.stItem || objParam.stItemGrp) &&
      objParam.stQty &&
      objParam.stPriceDate &&
      (GNIndicator == lib.GROSSNET.GROSS ||
        GNIndicator == "" ||
        GNIndicator == null)
    ) {
      var filters = [
        ["custrecord_ocp_discount_customer", "anyof", objParam.stCustomer],
        "and",
        ["custrecord_ocp_threshold", "lessthanorequalto", objParam.stQty],
        "and",
        ["custrecord_ocp_date_from", "onorbefore", stDate],
        "and",
        [
          ["custrecord_ocp_date_to", "onorafter", stDate],
          "or",
          ["custrecord_ocp_date_to", "isEmpty", "@NONE"],
        ],
      ];

      if (objParam.stItem && objParam.stItemGrp) {
        filters.push("and");
        var arrAnd = [];
        arrAnd.push(["custrecord_ocp_discount_item", "anyof", objParam.stItem]);
        arrAnd.push("or");
        arrAnd.push([
          "custrecord_ocp_discount_item_group",
          "anyof",
          objParam.stItemGrp,
        ]);
        filters.push(arrAnd);
      } else if (objParam.stItem) {
        filters.push("and");
        filters.push([
          "custrecord_ocp_discount_item",
          "anyof",
          objParam.stItem,
        ]);
      } else if (objParam.stItemGrp) {
        // log.debug('search filter', 'is Item Group, objParam.stItemGrp : ' + objParam.stItemGrp);
        filters.push("and");
        filters.push([
          "custrecord_ocp_discount_item_group",
          "anyof",
          objParam.stItemGrp,
        ]);
      }

      //SEARCH 1
      var arrResult = lib.runSearch(
        search,
        null,
        SEARCH_PRICING_DISCOUNT,
        filters
      );

      var arrResultSet = arrResult.getRange({
        start: 0,
        end: 1000,
      });

      var objResult = {};
      objResult.flLDDiscountVal = "";
      objResult.flPDDiscountVal = "";
      objResult.flAdjustmentType = "";
      /* objResult.flMLDDiscountVal = ""; */

      if (arrResultSet.length > 0) {
        //debugger;
        // Loop through the results and get the LD and PD

        //var flDiscountVal = forceFloat(arrResultSet[0].getValue('custrecord_ocp_discount_value'));

        for (var x = 0; x < arrResultSet.length; x++) {
          var flDiscountVal = lib.forceFloat(
            arrResultSet[x].getValue("custrecord_ocp_discount_value")
          );
          objResult.flAdjustmentType = arrResultSet[x].getValue(
            "custrecord_ocp_discount_adjustment_type"
          );

          if (flDiscountVal) {
            switch (objResult.flAdjustmentType) {
              case "1": //LD
                objResult.flLDDiscountVal = flDiscountVal;
                break;
              case "2": //PD
                objResult.flPDDiscountVal = flDiscountVal;
                break;
              /* case "3": //PD
                objResult.flMLDDiscountVal = flDiscountVal;
                break; */
            }
          }
        }
      }

      console.log("objResult - test:: " + JSON.stringify(objResult));

      var blRateManuallyChanged = currentRecord.getCurrentSublistValue({
        sublistId: "item",
        fieldId: "custcol_wnz_ocp_manually_changed",
      });
      if (blRateManuallyChanged) {
        if (objResult.flLDDiscountVal) {
          currentRecord.setCurrentSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.FLD_LINE_DISC,
            value: "",
            ignoreFieldChange: true,
          });
        }

        if (objResult.flPDDiscountVal) {
          currentRecord.setCurrentSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.FLD_PROMO_DISC,
            value: "",
            ignoreFieldChange: true,
          });
        }
      } else {
        if (objResult.flLDDiscountVal) {
          currentRecord.setCurrentSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.FLD_LINE_DISC,
            value: objResult.flLDDiscountVal,
            ignoreFieldChange: true,
          });
        }

        if (objResult.flPDDiscountVal) {
          currentRecord.setCurrentSublistValue({
            sublistId: "item",
            fieldId: lib.TRANS_LINE_FLDS.FLD_PROMO_DISC,
            value: objResult.flPDDiscountVal,
            ignoreFieldChange: true,
          });
        }
      }
    }
  }

  function roundup(num, dec) {
    dec = dec || 0;
    var s = String(num);
    if (num % 1) s = s.replace(/5$/, "6");
    return Number((+s).toFixed(dec));
  }

  function toFixed(num, fixed) {
    var re = new RegExp("^-?\\d+(?:.\\d{0," + (fixed || -1) + "})?");
    return num.toString().match(re)[0];
  }

  return {
    validateLine: WNZ_ValidateLine_Pricing,
    validateDelete: WNZ_ValidateDelete_Pricing,
    lineInit: WNZ_LineInit_Pricing,
    fieldChanged: WNZ_FieldChanged_Pricing,
    pageInit: WNZ_PageInit_Control,
    applyRepricing: applyRepricing,
    postSourcing: WNZ_PostSourcing_Pricing,
    saveRecord: WNZ_SaveRecord_Pricing,
  };
});
