let text = "";

const colorScale = d3.scaleOrdinal()
     .domain(["vowels","consonants","punctuation"])
    .range(["#baadda","#1f77b4","#2ca02c"]);

function charcategory(char){
    if ("aeiou".includes(char)){
         return "vowels";
        }
    if ("bcdfghjklmnpqrstvwxyz".includes(char)){
        return "consonants";
    }

    return "punctuation";
}

function showTooltip(html) {
    const tooltip = d3.select("#tooltip");
    tooltip.html(html)
      .style("opacity", 1)
      .style("left", (d3.event.pageX + 10) + "px")
      .style("top", (d3.event.pageY - 10) + "px");
  }

function hideTooltip() {
    d3.select("#tooltip").style("opacity", 0);
  }

function countCharacters(text){
    const charCount ={
        vowels:{},
        consonants:{},
        punctuation:{}
    };
    text.toLowerCase().split('').forEach(char => {
        const category = charcategory(char);
        if(category !=="punctuation"||".,!?;:".includes(char)){

            charCount[category][char] =(charCount[category][char] || 0)+ 1;
        
        }
    });
    return charCount;
}


// tree map : done

function createTreemapData(charCount){
    return {
        name: "root",
        children: Object.entries(charCount).map(([category,counts]) =>({
        name: category,
        children: Object.entries(counts).map(([char,count]) =>({ name:char,value:count}))
        }))
    };
}

function drawTreemap(data){
    const margin= { top:10,right:10,bottom:10,left:10};
    const width =560;
    const height=380;
    const svg = d3.select("#treemap_svg");
    svg.selectAll("*").remove();
    const treemap=d3.treemap()
    .size([width,height])
     .padding(1)
    .round(true);


    const root=d3.hierarchy(data)
      .sum(d =>d.value)
      .sort((a,b)=>b.value-a.value);
    treemap(root);

    const cell =svg.selectAll("g")
        .data(root.leaves())
        .enter().append("g")
        .attr("transform",d =>`translate(${d.x0+margin.left},${d.y0+margin.top})`);

        // add hower ere 
    cell.append("rect")
        .attr("width",d=>d.x1-d.x0)
        .attr("height",d=>d.y1-d.y0)
        .attr("fill",d=>colorScale(d.parent.data.name))
        .attr("stroke","black")
        .attr("stroke-width",1)
        .on("mouseover",function(event,d){
            showTooltip(`Character:${d.data.name}<br>Count:${d.data.value}`);
          })
          .on("mousemove",function(event){
            d3.select("#tooltip")
              .style("left",(event.pageX+10)+"px")
            .style("top",(event.pageY-10)+"px");
          })
        .on("mouseout",hideTooltip)
        .on("click",(event,d) =>drawSankey(d.data.name));

    
}

//sankey part to do 

function generateSankeyData(character) {
    const preocc ={};
    const postocc ={};
    const charCount = char.split(character).length - 1;

    for (let i = 0; i < char.length; i++) {
        if (char[i].toLowerCase() === character) {
            if (i > 0) preocc[char[i-1].toLowerCase()] = (preocc[char[i-1].toLowerCase()] || 0) + 1;
            if (i < char.length - 1) postocc[char[i+1].toLowerCase()] = (postocc[char[i+1].toLowerCase()] || 0) + 1;
        }
    }

    const nodes = [
        ...Object.keys(preocc).map(char => ({ name: `before_${char}` })),
        { name: `selected_${character}` },
        ...Object.keys(postocc).map(char => ({ name: `after_${char}` }))
    ];

    const links = [
        ...Object.entries(preocc).map(([char, value]) => ({
            source: nodes.findIndex(n => n.name === `before_${char}`),
            target: nodes.findIndex(n => n.name === `selected_${character}`),
            value
        })),
        ...Object.entries(postocc).map(([char, value]) => ({
            source: nodes.findIndex(n => n.name === `selected_${character}`),
            target: nodes.findIndex(n => n.name === `after_${char}`),
            value
        }))
    ];

    return { nodes, links, charCount };
}

function drawSankey(character) {
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = 540;
    const height = 360;

    const svg = d3.select("#sankey_svg");
    svg.selectAll("*").remove();

    const { nodes, links, charCount } = generateSankeyData(character);

    const sankey = d3.sankey()
        .nodeWidth(15)
        .nodePadding(10)
        .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]]);

    const graph = sankey({
        nodes: nodes.map(d =>Object.assign({},d)),
        links: links.map(d=>Object.assign({},d))
    });

    svg.append("g")
        .selectAll("path")
        .data(graph.links)
        .enter()
        .append("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke-width",d =>Math.max(1, d.width))
        .attr("stroke",d =>d3.color(colorScale(charcategory(d.source.name.split('_')[1]))).darker(0.5))
        .attr("fill","none")
        .attr("opacity", 0.5);

    svg.append("g")
        .selectAll("rect")
        .data(graph.nodes)
        .enter()
        .append("rect")
        .on("mouseover",function(event,d) {
            let howertext;
            if (d.name.startsWith("before_")) {
              howertext = `Character '${d.name.split('_')[1]}' flows into '${character}' ${d.value} times`;
            } else if (d.name.startsWith("selected_")) {
              howertext = `Character '${character}' appears ${d.value} times`;
            } else {
              howertext = `Character '${character}' flows into '${d.name.split('_')[1]}' ${d.value} times`;
            }
             showTooltip(howertext);
           })
           .on("mousemove", function(event) {
            d3.select("#tooltip")
          .style("left",(event.pageX+ 10)+ "px")
             .style("top",(event.pageY-10) +"px");
          })
        .on("mouseout",hideTooltip)
        .attr("x", d =>d.x0)
        .attr("y", d =>d.y0)
        .attr("height",d =>d.y1- d.y0)
        .attr("width",sankey.nodeWidth())
        .attr("fill", d =>colorScale(charcategory(d.name.split('_')[1])))
        .attr("stroke","black")
        .attr("stroke-width", 1)
        .attr("rx", 3)
        .attr("ry", 3);

    svg.append("g")
        .selectAll("text")
        .data(graph.nodes)
        .enter()
        .append("text")
        .attr("x", d =>d.x0<width/2?d.x1+6:d.x0- 6)
        .attr("y",d =>(d.y1+d.y0)/2)
        .attr("dy","0.35em")
        .attr("text-anchor",d=>d.x0<width/2? "start" : "end")
        .text(d =>d.name.split('_')[1]);


    d3.select("#flow_label").text(`Character flow for '${character}'`);
}


d3.select("#submit-btn").on("click", function() {
    char = d3.select("#wordbox").property("value").toLowerCase();
    const charCount = countCharacters(char);
    const treemapData = createTreemapData(charCount);
    drawTreemap(treemapData);
    d3.select("#sankey_svg").selectAll("*").remove();
    d3.select("#flow_label").text("Character flow for ...");
});