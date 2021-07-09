export default class Node {
    constructor(identifier, x, y){
        this.identifier = identifier;
        this.x = x;
        this.y = y;
        this.neighbours = [];
    }

    addNeighbour(node, edgeCost){
        this.neighbours.push({ node, cost: edgeCost });
    }
}