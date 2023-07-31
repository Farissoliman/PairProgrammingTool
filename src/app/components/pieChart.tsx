import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DataItem {
  label: string;
  value: number;
}

interface Props {
  data: DataItem[];
  width: number;
  height: number;
}

export const PieChart: React.FC<Props> = ({ data, width, height }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Define the radius and center of the pie chart
    const radius = Math.min(width, height) / 2;
    const centerX = width / 2;
    const centerY = height / 2;

    // Create the pie layout
    const pie = d3
      .pie<DataItem>()
      .sort(null)
      .value((d) => d.value);

    // Create the arc generator
    const arc = d3
      .arc<d3.PieArcDatum<DataItem>>()
      .innerRadius(0)
      .outerRadius(radius);

    // Select the SVG element and create a group for the chart
    const svg = d3.select(svgRef.current);
    const chartGroup = svg.append('g').attr('transform', `translate(${centerX}, ${centerY})`);

    // Generate the pie chart slices
    const pieData = pie(data);
    const slice = chartGroup.selectAll('.slice').data(pieData).enter().append('g').attr('class', 'slice');

    // Add the actual paths (slices) to the chart
    slice
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => d3.schemeCategory10[d.index % 10]);

    // Add text labels to the slices
    slice
      .append('text')
      .attr('transform', (d) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .text((d) => d.data.label);
  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height}></svg>;
};