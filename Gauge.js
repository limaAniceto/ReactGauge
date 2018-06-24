import React, {Component} from 'react';
import * as d3 from 'd3';


// Hello, this component was designed by https://gist.github.com/tomerd/1499279
// I tweaked it and set it up as a react component
class CurrentUsage extends Component {
    constructor(props) {
        super(props)
        this.createBarChart = this.createBarChart.bind(this);

        this.config = {
            size: 120,
            label: 'Now',
            min: 0,
            max: 100,
            minorTicks: 5,
            yellowZones: [{from: 100 * 0.75, to: 100 * 0.9}],
            redZones: [{from: 100 * 0.9, to: 100}],
            yellowColor: "#FF9900",
            redColor: "#DC3912",
        };
        this.config.size = this.config.size * 0.9;
        this.config.radius = this.config.size * 0.97 / 2;
        this.config.cx = this.config.size / 2;
        this.config.cy = this.config.size / 2;
        this.config.min = this.config.min;
        this.config.max = this.config.max;
        this.config.range = this.config.max - this.config.min;
        this.config.majorTicks = 5;
        this.config.minorTicks = 2;
        this.config.greenColor = "#109618";
        this.config.yellowColor = "#FF9900";
        this.config.redColor = "#DC3912";
        this.config.transitionDuration = 500;
    }

    valueToDegrees(value) {
        // thanks @closealert
        //return value / this.config.range * 270 - 45;
        return value / this.config.range * 270 - (this.config.min / this.config.range * 270 + 45);
    }

    valueToRadians(value) {
        return this.valueToDegrees(value) * Math.PI / 180;
    }

    valueToPoint(value, factor) {
        return {
            x: this.config.cx - this.config.radius * factor * Math.cos(this.valueToRadians(value)),
            y: this.config.cy - this.config.radius * factor * Math.sin(this.valueToRadians(value))
        };
    }

    buildPointerPath(value) {
        const delta = this.config.range / 13,
            head = this.valueToPoint(value, 0.85),
            head1 = this.valueToPoint(value - delta, 0.12),
            head2 = this.valueToPoint(value + delta, 0.12),
            tailValue = value - (this.config.range * (1 / (270 / 360)) / 2),
            tail = this.valueToPoint(tailValue, 0.28),
            tail1 = this.valueToPoint(tailValue - delta, 0.12),
            tail2 = this.valueToPoint(tailValue + delta, 0.12);
        return [head, head1, tail2, tail, tail1, head2, head];
    }

    drawBand(start, end, color, node) {
        if (0 >= end - start) return;

        d3.select(node).append("svg:path")
            .style("fill", color)
            .attr("d", d3.arc()
                .startAngle(this.valueToRadians(start))
                .endAngle(this.valueToRadians(end))
                .innerRadius(0.65 * this.config.radius)
                .outerRadius(0.85 * this.config.radius))
            .attr("transform", () => {
                return "translate(" + this.config.cx + ", " + this.config.cy + ") rotate(270)"
            });
    }

    createBarChart() {
        const node = this.node;

        d3.select(node).append("circle")
            .attr("cx", this.config.cx)
            .attr("cy", this.config.cy)
            .attr("r", this.config.radius)
            .style("fill", "#ccc")
            .style("stroke", "#000")
            .style("stroke-width", "0.5px");

        d3.select(node).append("svg:circle")
            .attr("cx", this.config.cx)
            .attr("cy", this.config.cy)
            .attr("r", 0.9 * this.config.radius)
            .style("fill", "#fff")
            .style("stroke", "#e0e0e0")
            .style("stroke-width", "2px");

        this.config.yellowZones.forEach(index => this.drawBand(index.from, index.to, this.config.yellowColor, node));

        this.config.redZones.forEach(index => this.drawBand(index.from, index.to, this.config.redColor, node));

        let fontSize = Math.round(this.config.size / 9);
        if (undefined != this.config.label) {
            d3.select(node).append("svg:text")
                .attr("x", this.config.cx)
                .attr("y", this.config.cy / 2 + fontSize / 2)
                .attr("dy", fontSize / 2)
                .attr("text-anchor", "middle")
                .text(this.config.label)
                .style("font-size", fontSize + "px")
                .style("fill", "#333")
                .style("stroke-width", "0px");
        }
        fontSize = Math.round(this.config.size / 16);
        const majorDelta = this.config.range / (this.config.majorTicks - 1);
        for (let major = this.config.min; major <= this.config.max; major += majorDelta) {
            const minorDelta = majorDelta / this.config.minorTicks;
            for (let minor = major + minorDelta; minor < Math.min(major + majorDelta, this.config.max); minor += minorDelta) {
                let point1 = this.valueToPoint(minor, 0.75);
                let point2 = this.valueToPoint(minor, 0.85);

                d3.select(node).append("svg:line")
                    .attr("x1", point1.x)
                    .attr("y1", point1.y)
                    .attr("x2", point2.x)
                    .attr("y2", point2.y)
                    .style("stroke", "#666")
                    .style("stroke-width", "1px");
            }

            let point1 = this.valueToPoint(major, 0.7);
            let point2 = this.valueToPoint(major, 0.85);

            d3.select(node).append("line")
                .attr("x1", point1.x)
                .attr("y1", point1.y)
                .attr("x2", point2.x)
                .attr("y2", point2.y)
                .style("stroke", "#333")
                .style("stroke-width", "2px");

            if (major == this.config.min || major == this.config.max) {
                const point = this.valueToPoint(major, 0.63);

                d3.select(node).append("svg:text")
                    .attr("x", point.x)
                    .attr("y", point.y)
                    .attr("dy", fontSize / 3)
                    .attr("text-anchor", major == this.config.min ? "start" : "end")
                    .text(major)
                    .style("font-size", fontSize + "px")
                    .style("fill", "#333")
                    .style("stroke-width", "0px");
            }
        }

        const pointerContainer = d3.select(node).append("svg:g").attr("class", "pointerContainer");
        const midValue = (this.config.min + this.config.max) / 2;
        const pointerPath = this.buildPointerPath(midValue);
        const pointerLine = d3.line()
            .x(function (d) {
                return d.x
            })
            .y(function (d) {
                return d.y
            })
            .curve(d3.curveBasis);

        pointerContainer.selectAll("path")
            .data([pointerPath])
            .enter()
            .append("path")
            .attr("d", pointerLine)
            .style("fill", "#dc3912")
            .style("stroke", "#c63310")
            .style("fill-opacity", 0.7);

        pointerContainer.append("circle")
            .attr("cx", this.config.cx)
            .attr("cy", this.config.cy)
            .attr("r", 0.12 * this.config.radius)
            .style("fill", "#4684EE")
            .style("stroke", "#666")
            .style("opacity", 1);

        fontSize = Math.round(this.config.size / 10);
        pointerContainer.selectAll("text")
            .data([midValue])
            .enter()
            .append("text")
            .attr("x", this.config.cx)
            .attr("y", this.config.size - this.config.cy / 4 - fontSize)
            .attr("dy", fontSize / 2)
            .attr("text-anchor", "middle")
            .style("font-size", fontSize + "px")
            .style("fill", "#000")
            .style("stroke-width", "0px");

    }

    render() {
        return <svg ref={node => this.node = node}
                    width={500} height={500}>
        </svg>
    }
}

export default CurrentUsage;