import React, { useEffect, useMemo, useRef, useState } from 'react';

import style from './DijkstraGraph.module.css'
import './DijkstraGraph.css'

function DijkstraGraph(props) {

    const [nodeDimensions, setNodeDimensions] = useState({
        size: 50
    });

    const [graphSize, setGraphSize] = useState(600);

    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

    const availableIdentifiers = useRef("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));

    // Generate connected graph from nodes and edges
    const graph = useMemo(() => {

        const getNode = (x, y) => {
            for(let node of nodes){
                if(node.x === x && node.y === y) return node;
            }
            return null;
        }

        const nodeToString = (node) => {
            if(!node) return null;
            return `x${node.x}y${node.y}`
        }

        // const nodeFromString = (nodeStr) => {
        //     let [x, y] = nodeStr.split("[xy]").remove("");
        //     return getNode(x, y);
        // }

        let graph = {};

        edges.forEach((edge, i) => {
            let attached = [getNode(edge.startX, edge.startY), getNode(edge.endX, edge.endY)];

            for(let i = 0; i < attached.length; i++){
                let nodeStr = nodeToString(attached[i]);
                let otherNode = i === 0 ? attached[1] : attached[0];

                if(graph[nodeStr]){ 
                    graph[nodeStr].push({ node: otherNode, cost: edge.cost });
                } else {
                    graph[nodeStr] = [{ node: otherNode, cost: edge.cost }];
                }
            }

        });

        return graph;
    }, [edges, nodes]);

    const isConnected = useMemo(() => {
        return Object.keys(graph).length === nodes.length;
    }, [graph, nodes.length]);

    const [changeEdgeCost, setChangeEdgeCost] = useState(null);
    const [changeText, setChangeText] = useState(null);
    const costInput = useRef();

    useEffect(() => {
        if(changeEdgeCost) costInput.current.focus();
    }, [changeEdgeCost]);

    useEffect(() => {
        if(!changeEdgeCost && changeText){

            let cost = parseInt(changeText.text);
            if(Object.is(cost, NaN) || cost > 100 || cost < 1) return;

            setEdges(current => {
                let newEdges = JSON.parse(JSON.stringify(current));
                newEdges.forEach((edge, i) => {
                    if(isSameEdge(changeText.edge, edge)){
                        newEdges[i].cost = cost;
                        return;
                    }
                });
                return newEdges;
            }); 
        }
    }, [changeEdgeCost, changeText]);

    const [changeIdentifier, setChangingIdentifier] = useState(null);
    const [newIdentifier, setNewIdentifier] = useState(null);
    const identifierInput = useRef();

    useEffect(() => {
        if(!changeIdentifier && newIdentifier){
            let char = newIdentifier.identifier.charAt(0).toUpperCase();
            if(availableIdentifiers.current.indexOf(char) === -1) return;
            
            availableIdentifiers.current.push(newIdentifier.node.identifier);
            const index = availableIdentifiers.current.indexOf(char);
            availableIdentifiers.current.splice(index, 1);
            availableIdentifiers.current.sort();

            setNodes(current => {
                let newNodes = JSON.parse(JSON.stringify(current));
                for(let i = 0; i < newNodes.length; i++){
                    if(isSameNode(newNodes[i], newIdentifier.node)){
                        newNodes[i].identifier = char;
                    }
                }
                return newNodes;
            });

        }
    }, [newIdentifier, changeIdentifier]);

    useEffect(() => {
        if(changeIdentifier) identifierInput.current.focus();
    }, [changeIdentifier])


    const [tool, setTool] = useState("node");
    const [drawEdge, setDrawEdge] = useState([]); // Should change this to a single object, no use having an array

    let toolStyle = {};

    switch(tool){
        case "node": toolStyle.color = "lime"; break;
        case "edge": toolStyle.color = "blue"; break;
        case "remove": {
            toolStyle = {
                color: "red",
                fontWeight: "bold"
            }
            break;
        }
        default: toolStyle.color = "black"; break;
    }

    return (
        <>
        <span>Select Tool: </span>
        <button onClick={() => setTool("node")}>Node</button>
        <button onClick={() => setTool("edge")}>Edge</button>
        <button onClick={() => setTool("remove")}>Remove</button>
        <span style={{ marginRight: "1rem" }}>Current Tool: <span style={toolStyle}>{`${tool}`}</span></span>
        <div 
        className="graph-container"
        style={{
            width: graphSize,
            height: graphSize,
            background: "black"
        }}
        onClick={(event) => {

            if(event.target.localName !== "input") {
                if(changeEdgeCost){
                    setChangeEdgeCost(null);
                }
            } 

            if(changeIdentifier){
                setChangingIdentifier(null);
                return null;
            }
            
            if(event.target.localName === "span"){
                return null;
            }

            // Handle node creation here. Handle edge creation in the onclick of the nodes.
            if(tool === "node"){

                if(availableIdentifiers.current.length === 0) return;

                const domRect = event.target.getBoundingClientRect();

                const posX = event.clientX - domRect.left;
                const posY = event.clientY - domRect.top;

                if(posX <= nodeDimensions.size/2 + 1 || posX >= graphSize - nodeDimensions.size/2 + 1 ||
                    posY <= nodeDimensions.size/2 + 1 || posY >= graphSize - nodeDimensions.size/2 + 1) return; 

                for(let node of nodes){
                    let distance = Math.sqrt(Math.pow(event.clientX - node.x, 2) + Math.pow(event.clientY - node.y, 2));
                    if(distance <= nodeDimensions.size*2) return;
                }

                let identifier = availableIdentifiers.current[0];

                setNodes(current => {
                    let newNodes = JSON.parse(JSON.stringify(current));
                    newNodes.push({
                        x: event.clientX,
                        y: event.clientY,
                        identifier
                    });
                    return newNodes;
                });

                let newIdentifiers = JSON.parse(JSON.stringify(availableIdentifiers.current));
                newIdentifiers.shift();
                availableIdentifiers.current = newIdentifiers;

                // setIdentifiers(current => {
                //     let newIdentifiers = JSON.parse(JSON.stringify(current));
                //     newIdentifiers.shift();
                //     return newIdentifiers;
                // });
            } 

        }}
        >
            {/* Draw edges */}
            {
                edges.map(edge => {

                    const rectWidth = Math.abs(edge.endX - edge.startX);
                    const rectHeight = Math.abs(edge.endY - edge.startY);

                    const edgeWidth = Math.sqrt(rectWidth*rectWidth + rectHeight*rectHeight);

                    let angle = Math.atan(rectWidth/rectHeight);

                    // If in the first quadrant: -Math.PI/2 + angle
                    // If in the second quadrant: 3/2*Math.PI - angle
                    // If in the third quadrant: Math.PI/2 + angle
                    // If in the fourth quadrant: Math.PI/2 - angle

                    if(edge.startX <= edge.endX && edge.startY >= edge.endY){
                        angle = -Math.PI/2 + angle;
                    } else if(edge.startX >= edge.endX && edge.startY >= edge.endY){
                        angle = 3/2*Math.PI - angle;
                    } else if(edge.startX >= edge.endX && edge.startY <= edge.endY){
                        angle = Math.PI/2 + angle;
                    } else if(edge.startX <= edge.endX && edge.startY <= edge.endY){
                        angle = Math.PI/2 - angle;
                    }

                    return <div
                    className={style["edge"]}
                    key={`start:(${edge.startX}, ${edge.startY}) end:(${edge.endX}, ${edge.endY})`}
                    style={{
                        top: edge.startY,
                        left: edge.startX,
                        width: edgeWidth,
                        transform: `rotate(${angle}rad)`
                    }}
                    onClick={() => {
                        if(tool === "remove"){
                            setEdges(current => {
                                let arr = [];
                                for(let testEdge of current){
                                    if(!isSameEdge(testEdge, edge)){
                                        arr.push(testEdge);
                                    }
                                }
                                return arr;
                            })
                        } 
                    }}
                    >
                    </div>
                })
            }

            {/* Draw nodes after lines so they have click event priority */}
            {
                nodes.map(node => {

                    let isChanging = false;
                    if(changeIdentifier){
                        if(node.identifier === changeIdentifier.identifier){
                            isChanging = true;
                        }
                    }
                    
                    return <div 
                    key={`x:${node.x} y:${node.y}`} 
                    className={style["node"]}
                    style={{
                        top: node.y,
                        left: node.x,
                        width: nodeDimensions.size,
                        height: nodeDimensions.size
                    }}
                    onClick={() => {
                        if(tool === "edge"){
                            if(drawEdge.length === 0){
                                setDrawEdge(() => {
                                    let arr = [];
                                    arr.push({
                                        x: node.x,
                                        y: node.y
                                    });
                                    return arr;
                                });
                            } else if(drawEdge.length === 1){
                                if(drawEdge[0].x === node.x && drawEdge[0].y === node.y) return;

                                const newEdge = {
                                    startX: drawEdge[0].x,
                                    startY: drawEdge[0].y,
                                    endX: node.x,
                                    endY: node.y,
                                    cost: 1,
                                    midpoint: {
                                        x: (drawEdge[0].x + node.x)/2,
                                        y: (drawEdge[0].y + node.y)/2
                                    }
                                };

                                let invalid = false;
                                for(let edge of edges){
                                    if(newEdge.startX === edge.startX && newEdge.startY === edge.startY &&
                                        newEdge.endX === edge.endX && newEdge.endY === edge.endY) {
                                        invalid = true;
                                    }
                                    if(newEdge.startX === edge.endX && newEdge.startY === edge.endY &&
                                        newEdge.endX === edge.startX && newEdge.endY === edge.startY) {
                                        invalid = true;
                                    }
                                }
                                
                                if(!invalid){
                                    setEdges(current => {
                                        const newEdges = JSON.parse(JSON.stringify(current));
                                        newEdges.push(newEdge);
                                        return newEdges;
                                    });
                                }
                                
                                setDrawEdge(() => []);

                            }
                        } else if(tool === "remove"){

                            let removeEdgeArr = [];
                            edges.forEach(edge => {
                                if((node.x === edge.startX && node.y === edge.startY) || (node.x === edge.endX && node.y === edge.endY)){
                                    removeEdgeArr.push(edge);
                                }
                            });

                            if(removeEdgeArr.length > 0){
                                setEdges(current => {
                                    let arr = [];
                                    current.forEach(edge => {
                                        let isValid = true;
                                        for(let testEdge of removeEdgeArr){
                                            if(isSameEdge(testEdge, edge)){
                                                isValid = false;
                                                break;
                                            }
                                        }
                                        if(isValid){
                                            arr.push(edge);
                                        }
                                    });
                                    return arr;
                                });
                            }

                            let identifier = node.identifier;

                            let newIdentifiers = JSON.parse(JSON.stringify(availableIdentifiers.current));
                            newIdentifiers.push(identifier);
                            newIdentifiers.sort();
                            availableIdentifiers.current = newIdentifiers;

                            // setIdentifiers(current => {
                            //     let newIdentifiers = JSON.parse(JSON.stringify(current));
                            //     newIdentifiers.push(identifier);
                            //     newIdentifiers.sort();
                            //     return newIdentifiers;
                            // });

                            setNodes(current => {
                                let arr = [];
                                for(let testNode of current){
                                    if(!isSameNode(testNode, node)){
                                        arr.push(testNode)
                                    }
                                }
                                return arr;
                            });

                        }
                    }}
                    >
                        <span
                        className={style["noselect"]}
                        style={{
                            fontWeight: "bold"
                        }}
                        onDoubleClick={() => {
                            setTool("node");
                            setChangingIdentifier(node);
                        }}
                        >
                            { !isChanging && node.identifier }
                        </span>
                    </div>
                })
            }

            {
                changeIdentifier &&
                <input
                className={style["center"]}
                style={{
                    color: "black",
                    fontWeight: "bold",
                    border: "none",
                    outline: "none",
                    background: "none",
                    textAlign: "center",
                    position: "absolute",
                    top: `${changeIdentifier.y}px`,
                    left: `${changeIdentifier.x}px`,
                }} 
                onChange={(event) => {
                    setNewIdentifier({
                        node: changeIdentifier,
                        identifier: event.target.value
                    });
                }} 
                onKeyPress={(event) => {
                    if(event.code === "Enter" || event.key === "Enter"){
                        setChangingIdentifier(null);
                    }
                }}
                ref={identifierInput}
                type="text" />
            }

            {
                edges.map(edge => {

                    let isChanging = false;
                    if(changeEdgeCost){
                        if(isSameEdge(changeEdgeCost, edge)){
                            isChanging = true;
                        }
                    }

                    return <span
                    key={Math.random()}
                    className={style["center"]}
                    style={{
                        color: "red",
                        position: "absolute",
                        top: `${edge.midpoint.y}px`,
                        left: `${edge.midpoint.x}px`,
                    }}
                    onClick={() => {
                        setTool("edge");
                        setChangeEdgeCost(edge);
                    }}
                    >
                        { !isChanging && edge.cost }
                    </span>
                })
            }

            {/* Edge Cost Input */}
            {
                changeEdgeCost && 
                <input
                className={style["center"]}
                style={{
                    color: "red",
                    border: "none",
                    outline: "none",
                    background: "none",
                    textAlign: "center",
                    position: "absolute",
                    top: `${changeEdgeCost.midpoint.y}px`,
                    left: `${changeEdgeCost.midpoint.x}px`,
                }} 
                onChange={(event) => {
                    setChangeText({
                        edge: changeEdgeCost,
                        text: event.target.value
                    });
                }} 
                onKeyPress={(event) => {
                    if(event.code === "Enter" || event.key === "Enter"){
                        setChangeEdgeCost(null);
                    }
                }}
                ref={costInput}
                type="text" />
            }
        </div>
        </>
    );
}

function isSameEdge(edge1, edge2){
    if(edge1.startX === edge2.startX && edge1.startY === edge2.startY &&
        edge1.endX === edge2.endX && edge1.endY === edge2.endY) {
        return true;
    }
    return false;
}

function isSameNode(node1, node2){
    if(node1.x === node2.x && node1.y === node2.y) return true;
    return false;
}

export default DijkstraGraph;