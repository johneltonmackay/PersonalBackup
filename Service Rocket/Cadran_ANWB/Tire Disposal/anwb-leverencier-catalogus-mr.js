/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 *
 */

var dependencies = [
  "N/record",
  "N/runtime",
  "N/xml",
  "./libs/lib-leverencier-catalogus",
  "N/search",
  "N/format"
];

define(dependencies, function (record, runtime, xmlMod, _lev,search,format) {
  const getInputData = () => {
    log.debug("GetInputData START");
    const ssId = runtime
      .getCurrentScript()
      .getParameter("custscript_anwb_lev_ss");
    if (ssId == "") {
      return [];
    }
    try {
      const toReturn = _lev.getSearch(ssId);
      /* toReturn.forEach((row) => {
        if(row.catalog_json == "") return true;
        row.catalog_json = JSON.parse(row.catalog_json);
        //const catalog_json = row.catalog_json.replace(/\r\n/g, "");
        if (catalog_json) {
          const xmlObj = xmlMod.Parser.fromString({
            text: catalog_json,
          });
          const jsonObj = xmlToJson(xmlObj.documentElement);
          row.catalog_json = JSON.parse(catalog_json);
        }
      }); */
      return toReturn;
    } catch (e) {
      log.error("ERROR ON GET INPUT ", e.toString());
    }
  };

  const reduce = (context) => {
    log.debug("START REDUCE");
    log.debug("REDUCE CONTEXT", context.values[0]);

    try {
      if (context.values[0]) {
        const data = JSON.parse(context.values[0]);
        if (data.link_to_item == "") {
          return true;
        }
        const itemObj = record.load({
          type: "inventoryitem",
          id: data.link_to_item,
          isDynamic: true,
        });
        const itemType = itemObj.type;
        log.debug('itemObj.vendor_category',itemObj.getValue("custitem_anwb_vendor_cat"))
        // saved search on customrecord_anwb_markups with vendor_category = itemObj.getValue("custitem_anwb_vendor_cat") fetch both custrecord_anwb_disposal_fee and custrecord_anwb_markup_sales
        if (itemObj.getValue("custitem_anwb_vendor_cat")) {
          var inchTiresValue = itemObj.getValue("custitem_anwb_cr_tyre_diameter");
          var markupSearch = search.create({
            type: "customrecord_anwb_markups",
            filters: [
              ["custrecord_anwb_vendor_cat", "anyof", itemObj.getValue("custitem_anwb_vendor_cat")],
              "AND",
              ["isinactive", "is", "F"],
            ],
            columns: [
              search.createColumn({
                name: "custrecord_anwb_disposal_fee",
                sort: search.Sort.ASC,
                label: "Disposal Fee",
              }),
              search.createColumn({
                name: "custrecord_anwb_markup_sales",
                sort: search.Sort.ASC,
                label: "Markup Sales",
              }),
            ],
          });
          if (inchTiresValue) {
            markupSearch.filters.push(
              search.createFilter({
                  name: 'custrecord_anwb_inch_tires',
                  operator: 'anyof',
                  values: inchTiresValue
              })
            )
          }
          var searchResultCount = markupSearch.runPaged().count;
          log.debug("markupSearch result count", searchResultCount);
          let disposalFee = 0;
          let markupSales = 0;
          markupSearch.run().each(function (result) {
            disposalFee = result.getValue({
              name: "custrecord_anwb_disposal_fee",
            });
            markupSales = result.getValue({
              name: "custrecord_anwb_markup_sales",
            });
            return true; // return true to keep iterating
          });


          // log disposalFee
          log.debug("disposalFee", disposalFee);
          // log markupSales
          log.debug("markupSales", markupSales);
          if (disposalFee != 0 || markupSales != 0) {
            log.debug("disposalFee", disposalFee);
            log.debug("markupSales", markupSales);
            if (data.inkoopprijs) {
              log.debug("item.inkoopprijs", data.inkoopprijs);
              data.inkoopprijs = format.parse({value:data.inkoopprijs, type: format.Type.FLOAT})
              if (disposalFee != 0) {
                disposalFee = format.parse({value:disposalFee, type: format.Type.FLOAT})
                data.inkoopprijs = data.inkoopprijs + disposalFee;
              }
              if (markupSales != 0) {
                markupSales = format.parse({value:markupSales, type: format.Type.FLOAT})
                data.verkoopprijs = data.inkoopprijs + markupSales;
              }
              // item.verkoopprijs = Number(item.inkoopprijs) + 36.70;
            } else {
              data.verkoopprijs = 0;
            }
          }
        }  
        log.debug("data.verkoopprijs", data.verkoopprijs);
        itemObj.selectLine({ sublistId: "price1", line: 0 });
        itemObj.setCurrentMatrixSublistValue({
          sublistId: "price1",
          fieldId: "price",
          column: 0,
          value: parseFloat(data.verkoopprijs),
        });
        itemObj.commitLine({ sublistId: "price1" });

        const itemVendorCount = itemObj.getLineCount({
          sublistId: "itemvendor",
        });
        log.debug("itemvendorcount", itemVendorCount);
        log.debug("data.leverencier", data.leverencier);
        log.debug("data.inkoopprijs", data.inkoopprijs);
        //update item vendor
        for (var x = 0; x < itemVendorCount; x++) {
          itemObj.selectLine({
            sublistId: "itemvendor",
            line: x,
          });
          const vendor = itemObj.getCurrentSublistValue({
            sublistId: "itemvendor",
            fieldId: "vendor",
          });
          log.debug("vendor", vendor);
          if (vendor == data.leverencier) {
            itemObj.removeLine({
              sublistId: "itemvendor",
              line: x,
            });
            break;
          }
        }
        itemObj.selectNewLine({ sublistId: "itemvendor" });
        itemObj.setCurrentSublistValue({
          sublistId: "itemvendor",
          fieldId: "vendor",
          value: data.leverencier,
        });
        itemObj.setCurrentSublistValue({
          sublistId: "itemvendor",
          fieldId: "purchaseprice",
          value: data.inkoopprijs,
        });
        itemObj.setCurrentSublistValue({
          sublistId: "itemvendor",
          fieldId: "preferredvendor",
          value: true,
        });
        itemObj.commitLine({ sublistId: "itemvendor" });

        itemObj.setValue({
          fieldId: "cost",
          value: parseFloat(data.inkoopprijs),
        });
        const itemID = itemObj.save();
        /* record.submitFields({
          type: itemType,
          id: itemID,
          values: {
            cost: parseFloat(data.inkoopprijs)
          },
        }); */
      }
    } catch (e) {
      log.error("ERROR ON REDUCE ", e.toString());
    }
  };

  const summarize = (context) => {
    log.debug("END MAPREDUCE");
  };

  const xmlToJson = (xmlNode) => {
    // Create the return object
    var obj = Object.create(null);

    if (xmlNode.nodeType == xmlMod.NodeType.ELEMENT_NODE) {
      // element
      // do attributes
      if (xmlNode.hasAttributes()) {
        obj["@attributes"] = Object.create(null);
        for (var j in xmlNode.attributes) {
          if (xmlNode.hasAttribute({ name: j })) {
            obj["@attributes"][j] = xmlNode.getAttribute({
              name: j,
            });
          }
        }
      }
    } else if (xmlNode.nodeType == xmlMod.NodeType.TEXT_NODE) {
      // text
      obj = xmlNode.nodeValue;
    }

    // do children
    if (xmlNode.hasChildNodes()) {
      for (var i = 0, childLen = xmlNode.childNodes.length; i < childLen; i++) {
        var childItem = xmlNode.childNodes[i];
        var nodeName = childItem.nodeName;
        if (nodeName in obj) {
          if (!Array.isArray(obj[nodeName])) {
            obj[nodeName] = [obj[nodeName]];
          }
          obj[nodeName].push(xmlToJson(childItem));
        } else {
          obj[nodeName] = xmlToJson(childItem);
        }
      }
    }

    return obj;
  };

  return {
    getInputData,
    reduce,
    summarize,
  };
});
