/**
 * Created by mlaug on 16.02.14.
 */

// needs to be set
var apikey = "your api key";

$(document).ready(function () {

    function setHeader(xhr) {
        xhr.setRequestHeader("X-Authorization", apikey)
    }

    function objectSize(obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };

    function generateTooltip(data) {
        var t = "<p>" + objectSize(data) + " Artikel</p>";
        t += "<ul>";
        for (var d in data) {
            if (data.hasOwnProperty(d)) {
                t += "<li><a target='_blank' href='" + data[d][0].href + "'>" + data[d][0].title + "</a></li>"
            }
        }
        t += "</ul>"
        return t;
    }

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var button = $('#zc-btnkeyword');

    var loadData = function () {

        button.button("loading");
        $('.result').html('');
        var keyword = $('#zc-keyword').val();

        $.ajax({
            url: 'http://api.zeit.de/content?q=' + keyword + '&offset=0&limit=1000',
            type: 'GET',
            dataType: 'json',
            success: function (json) {

                if ( json.found == 0 ){
                    $(".result").html('<div class="alert alert-warning">nothing found</div>');
                    return;
                }

                var data = d3.nest()
                    .key(function (d) {
                        return d.release_date.substr(0, 10);
                    })
                    .key(function (d) {
                        return d.uuid;
                    })
                    .rollup(function (d) {
                        return d
                    })
                    .map(json.matches);

                var width = 960,
                    height = 136,
                    cellSize = 17; // cell size

                var day = d3.time.format("%w"),
                    week = d3.time.format("%U"),
                    percent = d3.format(".1%"),
                    format = d3.time.format("%Y-%m-%d");

                var color = d3.scale.quantize()
                    .domain([1, 100])
                    .range(d3.range(11).map(function (d) {
                        return "q" + d + "-11";
                    }));

                var minYear = parseInt(d3.min(json.matches, function (d) {
                    return d.release_date.substr(0, 4);
                }));

                var maxYear = parseInt(d3.max(json.matches, function (d) {
                    return d.release_date.substr(0, 4);
                }));

                var svg = d3.select(".result").selectAll("svg")
                    .data(d3.range(minYear, maxYear + 1))
                    .enter().append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("class", "RdYlGn")
                    .append("g")
                    .attr("transform", "translate(" + ((width - cellSize * 53) / 2) + "," + (height - cellSize * 7 - 1) + ")");

                svg.append("text")
                    .attr("transform", "translate(-6," + cellSize * 3.5 + ")rotate(-90)")
                    .style("text-anchor", "middle")
                    .text(function (d) {
                        return d;
                    });

                rect = svg.selectAll(".day")
                    .data(function (d) {
                        return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1));
                    })
                    .enter().append("rect")
                    .attr("class", "day")
                    .attr("width", cellSize)
                    .attr("height", cellSize)
                    .attr("x", function (d) {
                        return week(d) * cellSize;
                    })
                    .attr("y", function (d) {
                        return day(d) * cellSize;
                    })
                    .datum(format);

                rect.append("title")
                    .text(function (d) {
                        return d;
                    });

                svg.selectAll(".month")
                    .data(function (d) {
                        return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1));
                    })
                    .enter().append("path")
                    .attr("class", "month")
                    .attr("d", monthPath);

                function monthPath(t0) {
                    var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
                        d0 = +day(t0), w0 = +week(t0),
                        d1 = +day(t1), w1 = +week(t1);
                    return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
                        + "H" + w0 * cellSize + "V" + 7 * cellSize
                        + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
                        + "H" + (w1 + 1) * cellSize + "V" + 0
                        + "H" + (w0 + 1) * cellSize + "Z";
                }

                d3.select(self.frameElement).style("height", "2910px");

                rect.filter(function (d) {
                    return d in data;
                }).attr("class", function (d) {
                        return "day " + color(objectSize(data[d]));
                    })
                    .on("mouseover", function (d) {
                        div.transition()
                            .duration(200)
                            .style("opacity", .9);
                        div.html(generateTooltip(data[d]))
                            .style("left", (d3.event.pageX) + "px")
                            .style("top", (d3.event.pageY - 28) + "px");
                    });

            },
            error: function () {
                alert('error!');
            },
            beforeSend: setHeader,
        }).always(function () {
                button.button("reset");
            });
    };

    // On enter and clicking button
    $('#zc-keyword').keyup(function (e) {
        if (e.keyCode == 13) {
            loadData();
        }
    });
    button.on("click", loadData);


});