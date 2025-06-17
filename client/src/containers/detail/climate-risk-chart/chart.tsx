// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

"use client";

import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

interface DataPoint {
  category: string;
  value: number;
  color: string;
  angle: number;
}

const data: DataPoint[] = [
  { category: "Projected loss", value: 0.8, color: "#E74C3C", angle: 0 },
  {
    category: "Thermal safety margin",
    value: 0.7,
    color: "#E74C3C",
    angle: 30,
  },
  { category: "Exposure", value: 0.4, color: "#E74C3C", angle: 60 },
  { category: "Ecosystem disruption", value: 0.6, color: "#E74C3C", angle: 90 },
  { category: "Climate change", value: 0.5, color: "#E74C3C", angle: 120 },
  { category: "Adaptivity", value: 0.3, color: "#52C4B0", angle: 150 },
  {
    category: "Habitat fragmentation",
    value: 0.4,
    color: "#52C4B0",
    angle: 180,
  },
  { category: "Maximum body length", value: 0.3, color: "#F39C12", angle: 210 },
  {
    category: "Precipitation change",
    value: 0.2,
    color: "#52C4B0",
    angle: 240,
  },
  { category: "Cumulative threats", value: 0.6, color: "#E74C3C", angle: 270 },
  { category: "Sensitivity", value: 0.8, color: "#E74C3C", angle: 300 },
  { category: "Species status", value: 0.5, color: "#52C4B0", angle: 330 },
];

const mainMetrics = [
  { label: "Sensitivity", value: 0.8, position: { x: -180, y: -120 } },
  { label: "Exposure", value: 0.4, position: { x: 180, y: -120 } },
  { label: "Adaptivity", value: 0.3, position: { x: 0, y: 180 } },
];

export default function RadarChart() {
  const svgRef = useRef<SVGSVGElement>(null);

  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    content: "",
  });

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 500;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 180;

    // Create scales
    const angleScale = d3
      .scaleLinear()
      .domain([0, 360])
      .range([0, 2 * Math.PI]);

    const radiusScale = d3.scaleLinear().domain([0, 1]).range([0, radius]);

    // Create main group
    const g = svg
      .append("g")
      .attr("transform", `translate(${centerX}, ${centerY})`);

    // Draw concentric circles (grid)
    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
    gridLevels.forEach((level) => {
      g.append("circle")
        .attr("r", radiusScale(level))
        .attr("fill", "none")
        .attr("stroke", "#E5E7EB")
        .attr("stroke-width", 1);
    });

    // Draw radial lines
    data.forEach((d) => {
      const angle = angleScale(d.angle) - Math.PI / 2;
      g.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", Math.cos(angle) * radius)
        .attr("y2", Math.sin(angle) * radius)
        .attr("stroke", "#E5E7EB")
        .attr("stroke-width", 1);
    });

    // Create pie generator for segments
    const pie = d3
      .pie<DataPoint>()
      .value(1) // Equal segments
      .startAngle(0)
      .endAngle(2 * Math.PI)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<DataPoint>>()
      .innerRadius(0)
      .outerRadius((d) => radiusScale(d.data.value));

    // Draw data segments with tooltip functionality
    g.selectAll(".segment")
      .data(pie(data))
      .enter()
      .append("path")
      .attr("class", "segment")
      .attr("d", arc)
      .attr("fill", (d) => d.data.color)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("opacity", 0.8)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        // Highlight segment
        d3.select(this).attr("opacity", 1);

        // Show tooltip
        const [mouseX, mouseY] = d3.pointer(event, svg.node());
        setTooltip({
          visible: true,
          x: mouseX,
          y: mouseY,
          content: `${d.data.category}: ${d.data.value}`,
        });
      })
      .on("mousemove", (event) => {
        const [mouseX, mouseY] = d3.pointer(event, svg.node());
        setTooltip((prev) => ({
          ...prev,
          x: mouseX,
          y: mouseY,
        }));
      })
      .on("mouseout", function () {
        // Remove highlight
        d3.select(this).attr("opacity", 0.8);

        // Hide tooltip
        setTooltip((prev) => ({ ...prev, visible: false }));
      });

    // Add category labels
    data.forEach((d) => {
      const angle = angleScale(d.angle) - Math.PI / 2;
      const labelRadius = radius + 20;
      const x = Math.cos(angle) * labelRadius;
      const y = Math.sin(angle) * labelRadius;

      g.append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "10px")
        .attr("font-family", "Arial, sans-serif")
        .attr("fill", "#374151")
        .text(d.category)
        .call(wrap, 60);
    });

    // Add main metric labels outside the chart
    mainMetrics.forEach((metric) => {
      const metricGroup = svg
        .append("g")
        .attr(
          "transform",
          `translate(${centerX + metric.position.x}, ${centerY + metric.position.y})`,
        );

      metricGroup
        .append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("fill", "#1F2937")
        .text(metric.label);

      metricGroup
        .append("text")
        .attr("text-anchor", "middle")
        .attr("y", 16)
        .attr("font-size", "12px")
        .attr("fill", "#6B7280")
        .text(metric.value.toString());
    });

    // Text wrapping function
    function wrap(
      text: d3.Selection<SVGTextElement, never, never, never>,
      width: number,
    ) {
      text.each(function () {
        const text = d3.select(this);
        const words = text.text().split(/\s+/).reverse();
        let word;
        let line: string[] = [];
        let lineNumber = 0;
        const lineHeight = 1.1;
        const y = text.attr("y");
        const dy = 0;
        let tspan = text
          .text(null)
          .append("tspan")
          .attr("x", text.attr("x"))
          .attr("y", y)
          .attr("dy", dy + "em");

        while ((word = words.pop())) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node()!.getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text
              .append("tspan")
              .attr("x", text.attr("x"))
              .attr("y", y)
              .attr("dy", ++lineNumber * lineHeight + dy + "em")
              .text(word);
          }
        }
      });
    }
  }, []);

  return (
    <div className="relative flex flex-col items-center ">
      <svg ref={svgRef} width={500} height={500} />
      {tooltip.visible && (
        <div
          className="absolute bg-gray-800 text-white px-2 py-1 rounded text-sm pointer-events-none z-10"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y,
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
