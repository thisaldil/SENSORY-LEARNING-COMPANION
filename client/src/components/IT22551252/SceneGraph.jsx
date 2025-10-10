import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export function SceneGraph({ nodes, links, onNodeClick }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = 500;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    // Create simulation for positioning nodes
    const simulation = d3
      .forceSimulation()
      .force(
        "link",
        d3
          .forceLink()
          .id((d) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const svg = d3.select(svgRef.current);

    // Create links
    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.6);

    // Create link labels
    const linkLabels = svg
      .append("g")
      .selectAll("text")
      .data(links)
      .enter()
      .append("text")
      .text((d) => d.label)
      .attr("font-size", "10px")
      .attr("text-anchor", "middle")
      .attr("fill", "#666");

    // Create nodes
    const node = svg
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 15)
      .attr("fill", (d) => getNodeColor(d.type))
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        if (onNodeClick) onNodeClick(d.id);
      })
      .call(drag(simulation));

    // Create node labels
    const nodeLabels = svg
      .append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .text((d) => d.label)
      .attr("font-size", "12px")
      .attr("text-anchor", "middle")
      .attr("dy", 25);

    // Update positions during simulation
    simulation.nodes(nodes).on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

      nodeLabels.attr("x", (d) => d.x).attr("y", (d) => d.y);

      linkLabels
        .attr("x", (d) => (d.source.x + d.target.x) / 2)
        .attr("y", (d) => (d.source.y + d.target.y) / 2);
    });

    // Zoom functionality
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        svg.selectAll("g").attr("transform", event.transform);
      });

    svg.call(zoom);

    // Start simulation
    simulation.force(
      "link",
      d3.forceLink(links).id((d) => d.id)
    );
  }, [nodes, links, onNodeClick]);

  // Drag behavior
  function drag(simulation) {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  // Color mapping for node types
  function getNodeColor(type) {
    switch (type) {
      case "concept":
        return "#4299E1"; // Blue
      case "example":
        return "#68D391"; // Green
      case "definition":
        return "#F6AD55"; // Orange
      case "character":
        return "#FC8181"; // Red
      default:
        return "#A0AEC0"; // Gray
    }
  }

  return (
    <div className="w-full h-full border rounded-lg bg-white shadow-sm">
      <svg ref={svgRef} width="100%" height="500" />
    </div>
  );
}
