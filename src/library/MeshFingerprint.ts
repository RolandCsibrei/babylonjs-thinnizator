import { Mesh, VertexBuffer } from '@babylonjs/core';

export class MeshFingerprint {
  public static createFingerprint(m: Mesh) {
    const totalVertices = m.getTotalVertices();
    const totalIndices = m.getTotalIndices();
    const vertices = m.getVerticesData(VertexBuffer.PositionKind);
    console.log(m.getVerticesData(VertexBuffer.NormalKind));
    console.log(m.geometry);
    const indices = m.getIndices();

    const boundingBox = m.getBoundingInfo().boundingBox;
    const extendMinimum = boundingBox.minimum;
    const extendMaximum = boundingBox.maximum;

    console.log(totalVertices);
    console.log(totalIndices);
    console.log(extendMinimum);
    console.log(extendMaximum);
    console.log(indices);
    console.log(vertices);

    // const hashbase = `${totalVertices}`;
    return m.id;
  }
}

/*
var createScene = function () {
	var scene = new BABYLON.Scene(engine);

	var camera = new BABYLON.ArcRotateCamera("Camera", 3 * Math.PI / 2, Math.PI / 8, 50, BABYLON.Vector3.Zero(), scene);

	camera.attachControl(canvas, true);

	var light = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);


	//Creation of a sphere 
	//(name of the sphere, segments, diameter, scene) 
	var sphere = BABYLON.Mesh.CreateSphere("sphere", 12, 10.0, scene);
	sphere.position = new BABYLON.Vector3(0, 10, 0); // Using a vector
	
	var pdata = sphere.getVerticesData(BABYLON.VertexBuffer.PositionKind);
	var ndata = sphere.getVerticesData(BABYLON.VertexBuffer.NormalKind);
	var idata = sphere.getIndices();	

	var newPdata = [];
	var newNdata = [];
	var newIdata =[];
	
	var mapPtr =0; // new index;
	var uniquePositions = []; // unique vertex positions
	for(var i=0; i<idata.length; i+=3) {
		var facet = [idata[i], idata[i + 1], idata[i+2]]; //facet vertex indices
		var pstring = []; //lists facet vertex positions (x,y,z) as string "xyz""
		for (var j = 0; j<3; j++) { //
			pstring[j] = "";
			for(var k = 0; k<3; k++) {
				if (Math.abs(pdata[3*facet[j] + k]) < 0.0001) {
					pdata[3*facet[j] + k] = 0;
				}
				pstring[j] += pdata[3*facet[j] + k] + "|";
			}
			pstring[j] = pstring[j].slice(0, -1);		
		}
		//check facet vertices to see that none are repeated
		// do not process any facet that has a repeated vertex, ie is a line
		if(!(pstring[0] == pstring[1] || pstring[0] == pstring[2] || pstring[1] == pstring[2])) {		
			//for each facet position check if already listed in uniquePositions
			// if not listed add to uniquePositions and set index pointer
			// if listed use its index in uniquePositions and new index pointer
			for(var j = 0; j<3; j++) { 
				var ptr = uniquePositions.indexOf(pstring[j])
				if(ptr < 0) {
					uniquePositions.push(pstring[j]);
					ptr = mapPtr++;
					//not listed so add individual x, y, z coordinates to new positions array newPdata
					//and add matching normal data to new normals array newNdata
					for(var k = 0; k<3; k++) {
						newPdata.push(pdata[3*facet[j] + k]);
						newNdata.push(ndata[3*facet[j] + k])
					}
				}
				// add new index pointer to new indices array newIdata
				newIdata.push(ptr);
			}
		}
	}
	
	//create new vertex data object and update
	var vertexData = new BABYLON.VertexData();
	vertexData.positions = newPdata;
	vertexData.indices = newIdata;
	vertexData.normals = newNdata;

	vertexData.applyToMesh(sphere);
	
	return scene;
}

*/
