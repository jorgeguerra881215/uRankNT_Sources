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
    var _list  = new ContentList();
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
        var observation = $('#urank-docviewer-labeling-text').val();
        if(_document != '' != label != ''){

            var terms = '';
            _selectedKeywords.map(function(sk){ terms = terms+'  ' + sk.term + '('+sk.weight+')' });
            _document.terms = terms;

            _document.title = label;
            _document.keyword = terms;
            _document.observation = observation;
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

            //Saving logs register
            urank.enterLog('Label - '+label+' - '+_document.id);

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
        keepElementFocus();
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
        keepElementFocus();
        saveLabel(event);
    }

    var keepElementFocus = function(){
        _list.selectListItem(_document.id);
        event.stopPropagation();
    }

    /**
     * Created by Jorch
     * Labeling connections like Normal
     */
    var hideUnrankedListItems = function() {

        if(_this.status !== RANKING_STATUS.no_ranking) {
            _this.data.forEach(function(d){
                var display = d.rankingPos > 0 ? '' : 'none';
                //$(liItem + '' + d.id).css('display', display);
                $('.'+liClass+'['+urankIdAttr+'="'+d.id+'"]').css('display', display);
            });
            $ul.addClass(ulPaddingBottomclass);
        }
        _this.multipleHighlightMode = false;
    };

    var _build = function(opt) {

        this.opt = opt.misc;

        var containerClasses = (this.opt.defaultBlockStyle) ? docViewerContainerClass +' '+ defaultDocViewerContainerClass : docViewerContainerClass;
        $root = $(s.root).empty().addClass(containerClasses);

        // Append details section, label and connection details
        $detailsSection = $("<div id='doc-viewer-detail' style='display: none' class='" + detailsSectionClass + "'></div>").appendTo($root);
        var $infoSection = $("<div id='doc-viewer-info'></div>").appendTo($detailsSection);

        //user section
        var $userSection = $('<div id="doc-user-section"></div>').appendTo($infoSection);
        $("<div id='doc-user-section-logo'></div>").appendTo($userSection);

        //Label section
        var $labelContainer = $('<div id="doc-label-section"></div>').appendTo($infoSection);
        $("<div id='doc-label-container'><label id='urank-docviewer-details-label' class='urank-docviewer-attributes'></label></div>").appendTo($labelContainer);
        $('<div id="doc-word-container"></div>').appendTo($infoSection);
        //$("<div id='urank-docviewer-details-title'></div>").appendTo($titleContainer);
        //$("<label id='urank-docviewer-details-label' class='urank-docviewer-attributes'></label>").appendTo($labelContainer);
        $("<div style='clear: both'></div>").appendTo($infoSection);

        /**
         * Modified by Jorch
         */
        //Section to show connection info
        var $titleContainer = $('<div class="doc-attributes-sontainer"></div>').appendTo($infoSection);
        $("<input type='checkbox' id='filter-initial-port' name='connection-attribute' value='initial-ip'><label>Ip Origin:</label>").appendTo($titleContainer);
        $("<label id='urank-docviewer-details-initport' class='urank-docviewer-attributes'></label>").appendTo($titleContainer);
        var $titleContainer = $('<div class="doc-attributes-sontainer"></div>').appendTo($infoSection);
        $("<input type='checkbox' id='filter-end-port' name='connection-attribute' value='end-ip'><label>Ip Dest:</label>").appendTo($titleContainer);
        $("<label id='urank-docviewer-details-destport' class='urank-docviewer-attributes'></label>").appendTo($titleContainer);
        var $titleContainer = $('<div class="doc-attributes-sontainer"></div>').appendTo($infoSection);
        $("<input type='checkbox' id='filter-port' name='connection-attribute' value='port'><label>Port:</label>").appendTo($titleContainer);
        $("<label id='urank-docviewer-details-port' class='urank-docviewer-attributes'></label>").appendTo($titleContainer);
        var $titleContainer = $('<div class="doc-attributes-sontainer"></div>').appendTo($infoSection);
        $("<input type='checkbox' id='filter-protocol' name='connection-attribute' value='protocol'><label>Protocol:</label>").appendTo($titleContainer);
        $("<label id='urank-docviewer-details-protocol' class='urank-docviewer-attributes'></label>").appendTo($titleContainer);

        //Dividing section
        $("<div class='urank-docviewer-divisor'></div>").appendTo($infoSection);

        var $titleContainer = $('<div></div>').appendTo($detailsSection);
        $("<div id='urank-docviewer-labeling'>" +
            "<input type='text' placeholder='Add new label...' id='label-text' style='display: none'>" +
            "<label>Tell us why you select this label:</label>"+
            "<textarea id='urank-docviewer-labeling-text' rows='5'></textarea>"+
            "<button id='urank-label-button-botnet'>Botnet</button>" +
            "<button id='urank-label-button-normal' style='float: right'>Normal</button>" +
            "</div>").appendTo($titleContainer);
        $('#urank-label-button-botnet').click(saveBotnetLabel);
        $('#urank-label-button-normal').click(saveNormalLabel);
        $('#urank-docviewer-labeling-text').click(keepElementFocus);

        //Dividing section
        $("<div class='urank-docviewer-divisor'></div>").appendTo($titleContainer);

        $('input[type=checkbox][name=connection-attribute]').change(function() {
            urank.findNotLabeled(this.value,this.filter);

        });

        this.opt.facetsToShow.forEach(function(facetName){
            var $facetContainer = $('<div></div>').appendTo($detailsSection);
            $("<label>" + facetName.capitalizeFirstLetter() + ":</label>").appendTo($facetContainer);
            $("<span id='urank-docviewer-details-" + facetName + "'></span>").appendTo($facetContainer);
        });

        // Append content section for snippet placeholder
        var $contentSectionOuter = $('<div style="height: 200px"></div>').appendTo($root).addClass(contentSectionOuterClass);
        $contentSection = $('<div></div>').appendTo($contentSectionOuter).addClass(contentSectionClass);
        $('<p></p>').appendTo($contentSection);

        //Statistic section
        var $statisticSection = $("<div id='doc-viewer-statistic'></div>").appendTo($root);
        $("<div id='doc-viewer-top'></div>").appendTo($statisticSection);
        $("<div id='doc-viewer-left'></div>").appendTo($statisticSection);


        $root.on('mousedown', function(event){ event.stopPropagation(); });

        /*if(this.opt.customScrollBars)
            $contentSectionOuter.css('overflowY', 'hidden').mCustomScrollbar(customScrollOptions);*/




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
        var port_info = document.connection_id.split("-");
        var init_port = port_info[0];
        var dest_port = port_info[1];
        var port = port_info[2];
        var protocol = port_info[3];
        $('#label-text').val('');
        $('#urank-docviewer-labeling-text').val(_document.observation);
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
                $('#urank-docviewer-details-label').removeClass('normal');
                $('#urank-docviewer-details-label').removeClass('unlabelled');
                $('#urank-docviewer-details-label').addClass('botnet');
                break;
            case 'Normal':
                bton_norm.css('opacity',0.5);
                bton_norm.prop('disabled', true);
                bton_bot.css('opacity',1);
                bton_bot.prop('disabled', false);
                $('#urank-docviewer-details-label').removeClass('botnet');
                $('#urank-docviewer-details-label').removeClass('unlabelled');
                $('#urank-docviewer-details-label').addClass('normal');
                break;
            default:
                bton_bot.css('opacity',1);
                bton_bot.prop('disabled', false);
                bton_norm.css('opacity',1);
                bton_norm.prop('disabled', false);
                $('#urank-docviewer-details-label').removeClass('botnet');
                $('#urank-docviewer-details-label').removeClass('normal');
                $('#urank-docviewer-details-label').addClass('unlabelled');
        }


        $(detailItemIdPrefix + 'label').html(document.title); //class='urank-tagcloud-tag ui-draggable ui-draggable-handle dragging active'
        /*"<div style='width: 100%; height: 30px'>"+
         document.keyword+
         "</div>");*/
        $('#doc-word-container').html('');
        document.keyword.split(' ').forEach(function(item){
            item != '' && item != ' ' ? $('#doc-word-container').append('<label class="doc-word">'+' '+ item+'</label>') : null;
        });

        //show statistic
        $('#doc-viewer-top').html('');
        $('#doc-viewer-left').html('');
        var letters = [];
        var description = document.description;
        var i = description.length;
        while (i--) {
            var characterReg = /[a-zA-Z]/;
            var item = description[i];
            if(characterReg.test(item)) {
                letters.push(item);
            }
        }

        var count_letters = letters.length;
        var initial_porcent = 100/count_letters;
        var letter_porcent = {};
        var characteristic_porcent = {
            SP:0,
            WP:0,
            SNP:0,
            WNP:0
        };
        letters.forEach(function(item){
            letter_porcent[item] = item in letter_porcent ? letter_porcent[item] + initial_porcent : initial_porcent;
            var strong_periodicReg = /[a-i]/;
            var weak_periodicReg = /[A-I]/;
            var strong_nonperiodicReg = /[R-Z]/;
            var weak_nonperiodicReg = /[r-z]/;

            strong_periodicReg.test(item) ? characteristic_porcent['SP'] += 1 : null;
            weak_periodicReg.test(item) ? characteristic_porcent['WP'] += 1 : null;
            strong_nonperiodicReg.test(item) ? characteristic_porcent['SNP'] += 1 : null;
            weak_nonperiodicReg.test(item) ? characteristic_porcent['WNP'] += 1 : null;

        });

        var letter_data = [];
        $.each(letter_porcent , function(index, value) {
            var element = {
                date: index,
                value: value
            }
            letter_data.push(element)
        });

        var periodic_data = [];
        $.each(characteristic_porcent, function(index,value){
            var element = {
                age: index,
                population: value
            }
            periodic_data.push(element);
        })
        _showBarChart('doc-viewer-top',letter_data);
        _showPieChart('doc-viewer-left',periodic_data);

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

        //Saving logs register
        urank.enterLog('Connection - '+ _document.id);
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

    var _showBarChart = function(idElement,data){

        var margin = {top: 20, right: 20, bottom: 70, left: 40},
            width = 400 - margin.left - margin.right,
            height = 200 - margin.top - margin.bottom;

        var x = d3.scale.ordinal().rangeRoundBands([0, width], .05);

        var y = d3.scale.linear().range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(10);
        //.tickFormat(d3.time.format("%Y-%m"));

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(10);

        var svg = d3.select('#'+idElement).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        data.forEach(function(d) {
            d.date = d.date;
            d.value = +d.value;
        });

        //x.domain(data.map(function(d) { return d.keys; }));
        x.domain(data.map(function(d) { return d.date; }));
        y.domain([0, d3.max(data, function(d) { return d.value; })]);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", "-.55em")
            .attr("transform", "rotate(-90)" );

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Letter (%)");

        svg.selectAll("bar")
            .data(data)
            .enter().append("rect")
            .style("fill", "steelblue")
            .attr("x", function(d) { return x(d.date); })
            .attr("width", x.rangeBand())
            .attr("y", function(d) { return y(d.value); })
            .attr("height", function(d) { return height - y(d.value); });

    }

    var _showPieChart = function(idElement,data){
        var _data = data;
        var width = 320,
            height = 160,
            radius = Math.min(width, height) / 2;

        var color = d3.scale.ordinal()
            .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

        var arc = d3.svg.arc()
            .outerRadius(radius - 10)
            .innerRadius(0);

        var labelArc = d3.svg.arc()
            .outerRadius(radius - 40)
            .innerRadius(radius - 40);

        var pie = d3.layout.pie()
            .sort(null)
            .value(function(d) { return d.population; });

        var svg = d3.select('#'+idElement).append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + 90 + "," + 80 + ")");

        d3.csv("data.csv", type, function(error, data) {
            //if (error) throw error;

            data = _data;

            var g = svg.selectAll(".arc")
                .data(pie(data))
                .enter().append("g")
                .attr("class", "arc");

            g.append("path")
                .attr("d", arc)
                .style("fill", function(d) { return color(d.data.age); });

            g.append("text")
                .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
                .attr("dy", ".35em")
                .text(function(d) { return d.data.age; });
        });
        function type(d) {
            d.population = +d.population;
            return d;
        }
    }

    var _showDonutChart = function(idElement,data){
        var _data = data;
        var width = 320,
            height = 160,
            radius = Math.min(width, height) / 2;

        var color = d3.scale.ordinal()
            .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

        var arc = d3.svg.arc()
            .outerRadius(radius - 10)
            .innerRadius(radius - 40);

        var pie = d3.layout.pie()
            .sort(null)
            .value(function(d) { return d.population; });

        var svg = d3.select('#'+idElement).append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + 90 + "," + 80 + ")");

        d3.csv("data.csv", type, function(error, data) {
            //if (error) throw error;

            data = _data;

            var g = svg.selectAll(".arc")
                .data(pie(data))
                .enter().append("g")
                .attr("class", "arc");

            g.append("path")
                .attr("d", arc)
                .style("fill", function(d) { return color(d.data.age); });

            g.append("text")
                .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
                .attr("dy", ".35em")
                .text(function(d) { return d.data.age; });
        });

        function type(d) {
            d.population = +d.population;
            return d;
        }
    }

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