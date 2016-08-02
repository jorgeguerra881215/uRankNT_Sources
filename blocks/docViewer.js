var DocViewer = (function(){

    var _this;
    // Settings
    var s = {};
    // Classes
    var docViewerContainerClass = 'urank-docviewer-container',
        defaultDocViewerContainerClass = 'urank-docviewer-container-default',
        detailsSectionClass = 'urank-docviewer-details-section',
        contentSectionOuterClass = 'urank-docviewer-content-section-outer',
        contentSectionClass = 'urank-docviewer-content-section';
    // Id prefix
    var detailItemIdPrefix = '#urank-docviewer-details-';
    // Selectors
    var $root = $(''),
        $detailsSection = $(''),
        $contentSection = $('');
    // Helper
    var customScrollOptions = {
        axis: 'y',
        theme: 'light',
        //scrollbarPosition: 'outside',
        autoHideScrollbar: true,
        scrollEasing: 'linear',
        mouseWheel: {
            enable: true,
            axis: 'y'
        },
        keyboard: {
            enable: true
        },
        advanced: {
            updateOnContentResize: true
        }
    };

    /**
     * Modified by Jorch
     */
    var _document,_keywords,_colorScale = '';
    var list  = new ContentList();
    var _selectedKeywords = [];
    //var fs = require("fs");

    function DocViewer(arguments) {
        s = $.extend({
            root: ''
        }, arguments);
    }
    /**
     * Modified by Jorch
     */
    var saveLabel = function saveLabelBton(event){
        var label = $('#label-text').val();
        if(_document != '' != label != ''){

            var terms = '';
            _selectedKeywords.map(function(sk){ terms = terms+'  ' + sk.term + '('+sk.weight+')' });
            _document.terms = terms;

            _document.title = label;
            _document.keyword = terms;
            _showDocument(_document,_keywords,_colorScale);
            $('#label-text').val(label);
            var label_list = $("#contentlist ul li[urank-id='"+_document.id+"'] h3");
            //label_list.html(_document.title);
            label_list.attr('title',_document.title+'\n'+_document.description);




            //list.build(_keywords,null);
            /*s.readFile('test.json', 'utf8', function(err,data){
                console.log(data);
            });*/
            //Write info in data.txt file using php script
            var scriptURL = '../server/save.php',
                date = new Date(),
                timestamp = date.getFullYear() + '-' + (parseInt(date.getMonth()) + 1) + '-' + date.getDate() + '_' + date.getHours() + '.' + date.getMinutes() + '.' + date.getSeconds(),
                urankState = urank.getCurrentState(),
                gf = [{ filename: 'urank_labeled_' + timestamp + '.txt', content: JSON.stringify(urankState) }];//JSON.stringify(urankState)

            $.generateFile({ filename: "bookmarks.json", content: JSON.stringify(urankState), script: scriptURL });

            return false;
        }
    }


    /**
     * Created by Jorch
     * Labeling connections like Botnet
     */
    var saveBotnetLabel = function saveLabelBton(event){
        $('#label-text').val("Botnet");
        //changing a color
        $("[urank-span-id='"+_document.id+"']").removeClass('yellow-circle');
        $("[urank-span-id='"+_document.id+"']").removeClass('green-circle');
        $("[urank-span-id='"+_document.id+"']").addClass('red-circle');
        saveLabel(event);

    }

    /**
     * Created by Jorch
     * Labeling connections like Normal
     */
    var saveNormalLabel = function saveLabelBton(event){
        $('#label-text').val("Normal");
        //changing a color

        $("[urank-span-id='"+_document.id+"']").removeClass('yellow-circle');
        $("[urank-span-id='"+_document.id+"']").removeClass('red-circle');
        $("[urank-span-id='"+_document.id+"']").addClass('green-circle');
        saveLabel(event);
    }

    var _build = function(opt) {

        this.opt = opt.misc;

        var containerClasses = (this.opt.defaultBlockStyle) ? docViewerContainerClass +' '+ defaultDocViewerContainerClass : docViewerContainerClass;
        $root = $(s.root).empty().addClass(containerClasses);

        // Append details section, titles and placeholders for doc details
        $detailsSection = $("<div id='doc-viewer-detail' style='display: none' class='" + detailsSectionClass + "'></div>").appendTo($root);

        var $titleContainer = $('<div style="height: 30px"></div>').appendTo($detailsSection);
        $("<label>Label:</label>").appendTo($titleContainer);
        //$("<div id='urank-docviewer-details-title'></div>").appendTo($titleContainer);
        $("<label id='urank-docviewer-details-label' class='urank-docviewer-attributes'></label>").appendTo($titleContainer);

        /**
         * Modified by Jorch
         */
        //Section to show connection info
        var $titleContainer = $('<div style="height: 30px; margin-top: 30px"></div>').appendTo($detailsSection);
        $("<input type='checkbox' id='filter-initial-port' name='connection-attribute' value='initial-ip'><label>Initial IP:</label>").appendTo($titleContainer);
        $("<label id='urank-docviewer-details-initport' class='urank-docviewer-attributes'></label>").appendTo($titleContainer);
        var $titleContainer = $('<div style="height: 30px"></div>').appendTo($detailsSection);
        $("<input type='checkbox' id='filter-end-port' name='connection-attribute' value='end-ip'><label>End IP:</label>").appendTo($titleContainer);
        $("<label id='urank-docviewer-details-destport' class='urank-docviewer-attributes'></label>").appendTo($titleContainer);
        var $titleContainer = $('<div style="height: 30px"></div>').appendTo($detailsSection);
        $("<input type='checkbox' id='filter-port' name='connection-attribute' value='port'><label>Port:</label>").appendTo($titleContainer);
        $("<label id='urank-docviewer-details-port' class='urank-docviewer-attributes'></label>").appendTo($titleContainer);
        var $titleContainer = $('<div style="height: 30px"></div>').appendTo($detailsSection);
        $("<input type='checkbox' id='filter-protocol' name='connection-attribute' value='protocol'><label>Protocol:</label>").appendTo($titleContainer);
        $("<label id='urank-docviewer-details-protocol' class='urank-docviewer-attributes'></label>").appendTo($titleContainer);

        var $titleContainer = $('<div></div>').appendTo($detailsSection);
        $("<div id='urank-docviewer-labeling'>" +
            "<input type='text' placeholder='Add new label...' id='label-text' style='display: none'>" +
            "<button id='urank-label-button-botnet'>Botnet</button>" +
            "<button id='urank-label-button-normal' style='float: right'>Normal</button>" +
            "<textarea id='urank-docviewer-labeling-text' rows='5' placeholder='Give us your tools for labeling'></textarea>"+
          "</div>").appendTo($titleContainer);
        $('#urank-label-button-botnet').click(saveBotnetLabel);
        $('#urank-label-button-normal').click(saveNormalLabel);

        $('input[type=checkbox][name=connection-attribute]').change(function() {
            urank.findNotLabeled(this.value,this.filter);

        });

        this.opt.facetsToShow.forEach(function(facetName){
            var $facetContainer = $('<div></div>').appendTo($detailsSection);
            $("<label>" + facetName.capitalizeFirstLetter() + ":</label>").appendTo($facetContainer);
            $("<span id='urank-docviewer-details-" + facetName + "'></span>").appendTo($facetContainer);
        });

        // Append content section for snippet placeholder
        var $contentSectionOuter = $('<div></div>').appendTo($root).addClass(contentSectionOuterClass);
        $contentSection = $('<div></div>').appendTo($contentSectionOuter).addClass(contentSectionClass);
        $('<p></p>').appendTo($contentSection);

        $root.on('mousedown', function(event){ event.stopPropagation(); });

        if(this.opt.customScrollBars)
            $contentSectionOuter.css('overflowY', 'hidden').mCustomScrollbar(customScrollOptions);




    };



    /**
    * @private
    * Description
    * @param {type} document Description
    * @param {Array} keywords (only stems)
    */
    var _showDocument = function(document, keywords, colorScale){
        /**
         * Modified by Jorch
         */
        _document = document;
        _keywords = keywords;
        _colorScale = colorScale;
        $('#doc-viewer-detail').css('display','block');
        var port_info = document.id.split("-");
        var init_port = port_info[0];
        var dest_port = port_info[1];
        var port = port_info[2];
        var protocol = port_info[3];
        $('#label-text').val('');
        $(detailItemIdPrefix + 'initport').html(getStyledText(init_port, keywords, colorScale));
        $(detailItemIdPrefix + 'destport').html(getStyledText(dest_port, keywords, colorScale));
        $(detailItemIdPrefix + 'port').html(getStyledText(port, keywords, colorScale));
        $(detailItemIdPrefix + 'protocol').html(getStyledText(protocol, keywords, colorScale));
        $('#filter-initial-port').attr('value',init_port);
        $('#filter-end-port').attr('value',dest_port);
        $('#filter-port').attr('value',port);
        $('#filter-protocol').attr('value',protocol);
        //$('#urank-label-button-normal').prop('disabled', true);
        var bton_bot = $('#urank-label-button-botnet');
        var bton_norm = $('#urank-label-button-normal');
        switch (document.title){
            case 'Botnet':
                bton_bot.css('opacity',0.5);
                bton_bot.prop('disabled', true);
                bton_norm.css('opacity',1);
                bton_norm.prop('disabled', false);
                break;
            case 'Normal':
                bton_norm.css('opacity',0.5);
                bton_norm.prop('disabled', true);
                bton_bot.css('opacity',1);
                bton_bot.prop('disabled', false);
                break;
            default:
                bton_bot.css('opacity',1);
                bton_bot.prop('disabled', false);
                bton_norm.css('opacity',1);
                bton_norm.prop('disabled', false);
        }

        $(detailItemIdPrefix + 'label').html(document.title+ //class='urank-tagcloud-tag ui-draggable ui-draggable-handle dragging active'
            "<div style='width: 100%; height: 30px'>"+
                ""+
                document.keyword+
            "</div>");


        var getFacet = function(facetName, facetValue){
            return facetName == 'year' ? parseDate(facetValue) : facetValue;
        };

        var facets = (this.opt && this.opt.facetsToShow) ? this.opt.facetsToShow : [];
        facets.forEach(function(facet){
            //console.log(getFacet(facet, document.facets[facet]));
            //$(detailItemIdPrefix + '' + facet).html(getFacet(facet, document.facets[facet]));
            $(detailItemIdPrefix + '' + facet).html(document.facets[facet]);
        });

        $contentSection.empty();
        var $p = $('<p></p>').appendTo($contentSection).html(getStyleWordSecuencie(document.description, keywords, colorScale));
        $p.hide().fadeIn('slow').scrollTo('top');
    };

    /**
     * Created by Jorch
     * @private
     */
     var _updateSelectedKeys = function(selectedKeyWords){
        _selectedKeywords = selectedKeyWords
    };

    var _clear = function(){
        /**
         * Modified by Jorch
         */
        // Clear details section
        /*$(detailItemIdPrefix + 'title').empty();
        var facets = (this.opt && this.opt.facetsToShow) ? this.opt.facetsToShow : [];
        facets.forEach(function(facet){
            $(detailItemIdPrefix + '' + facet).empty();
        });
        // Clear content section
        $contentSection.empty();*/
    };


    var _destroy = function() {
        $root.empty().removeClass(docViewerContainerClass)
    };


    // Prototype
    DocViewer.prototype = {
        build: _build,
        clear: _clear,
        showDocument: _showDocument,
        destroy: _destroy,
        /**
         * Modified by Jorch
         */
        updateSelectedKeys: _updateSelectedKeys
    };

    return DocViewer;
})();
