import * as THREE from 'three';

export interface VaseAssembly {
    gardenRig: THREE.Group;
    vaseGroup: THREE.Group;
    tagGroup: THREE.Group;
    vaseMesh: THREE.Mesh;
    soilMesh: THREE.Mesh;
}

export function createVaseAssembly(): VaseAssembly {
    const gardenRig = new THREE.Group();

    // Smooth Rounded Pedestal Base
    const pedestalGeo = new THREE.CylinderGeometry(2.4, 2.6, 0.45, 64);
    const pedestalMat = new THREE.MeshStandardMaterial({
        color: 0xEDE2D3,
        roughness: 0.7,
        metalness: 0.02
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -1.25;
    pedestal.receiveShadow = true;
    gardenRig.add(pedestal);

    // Vase Group
    const vaseGroup = new THREE.Group();
    gardenRig.add(vaseGroup);

    // Smooth Procedural Spline for curved ceramic silhouette
    const outerCurve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(0.62, -0.9, 0),
        new THREE.Vector3(1.15, -0.4, 0),
        new THREE.Vector3(1.08, 0.4, 0),
        new THREE.Vector3(0.74, 1.15, 0)
    );

    const rawPoints = outerCurve.getPoints(32);
    const lathePoints: THREE.Vector2[] = [];

    // Flat base bottom
    lathePoints.push(new THREE.Vector2(0.0, -0.9));

    // Sample smooth outer belly
    rawPoints.forEach((p) => {
        lathePoints.push(new THREE.Vector2(p.x, p.y));
    });

    // Soft rounded rim lip
    lathePoints.push(new THREE.Vector2(0.77, 1.22));
    lathePoints.push(new THREE.Vector2(0.80, 1.28));
    lathePoints.push(new THREE.Vector2(0.78, 1.32));
    lathePoints.push(new THREE.Vector2(0.73, 1.31));
    lathePoints.push(new THREE.Vector2(0.68, 1.25));

    // Inner wall down to soil level
    lathePoints.push(new THREE.Vector2(0.65, 1.10));
    lathePoints.push(new THREE.Vector2(0.62, 0.96));

    const vaseGeo = new THREE.LatheGeometry(lathePoints, 96);
    vaseGeo.computeVertexNormals();

    const ceramicMat = new THREE.MeshStandardMaterial({
        color: 0xF7F2E8,
        roughness: 0.28,
        metalness: 0.04,
        side: THREE.DoubleSide
    });

    const vaseMesh = new THREE.Mesh(vaseGeo, ceramicMat);
    vaseMesh.castShadow = true;
    vaseMesh.receiveShadow = true;
    vaseMesh.userData = { isPot: true };
    vaseGroup.add(vaseMesh);

    // Soil disk
    const soilGeo = new THREE.CylinderGeometry(0.63, 0.63, 0.15, 48);
    const soilMat = new THREE.MeshStandardMaterial({
        color: 0x473528,
        roughness: 0.9,
        side: THREE.DoubleSide
    });
    const soilMesh = new THREE.Mesh(soilGeo, soilMat);
    soilMesh.position.y = 0.98;
    soilMesh.userData = { isPot: true };
    vaseGroup.add(soilMesh);

    // Smooth Gold Accent Ring
    const goldRingGeo = new THREE.TorusGeometry(0.75, 0.035, 24, 64);
    const goldMat = new THREE.MeshStandardMaterial({
        color: 0xE2C082,
        roughness: 0.22,
        metalness: 0.8
    });
    const goldRing = new THREE.Mesh(goldRingGeo, goldMat);
    goldRing.rotation.x = Math.PI / 2;
    goldRing.position.y = 1.05;
    vaseGroup.add(goldRing);

    // Hanging Tag: Resting directly flush against the front surface of the vase
    const tagGroup = new THREE.Group();
    tagGroup.position.set(0.22, 0.68, 0.89);
    tagGroup.rotation.set(-0.28, 0.22, -0.06);

    // Delicate golden loop string tying tag to the gold collar
    const stringGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.38, 8);
    const stringMesh = new THREE.Mesh(stringGeo, goldMat);
    stringMesh.position.set(0, 0.38, -0.04);
    stringMesh.rotation.x = 0.15;
    tagGroup.add(stringMesh);

    // Tag Card Body
    const tagGeo = new THREE.BoxGeometry(0.42, 0.58, 0.02);
    const tagMat = new THREE.MeshStandardMaterial({
        color: 0xFBF5E5,
        roughness: 0.75,
        side: THREE.DoubleSide
    });
    const tagMesh = new THREE.Mesh(tagGeo, tagMat);
    tagMesh.castShadow = true;
    tagMesh.userData = { isTag: true };
    tagGroup.add(tagMesh);

    // Red Heart Stamp
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0);
    heartShape.bezierCurveTo(0, 0.06, 0.08, 0.12, 0.12, 0.06);
    heartShape.bezierCurveTo(0.16, 0, 0, -0.12, 0, -0.12);
    heartShape.bezierCurveTo(0, -0.12, -0.16, 0, -0.12, 0.06);
    heartShape.bezierCurveTo(-0.08, 0.12, 0, 0.06, 0, 0);

    const heartGeo = new THREE.ShapeGeometry(heartShape);
    const heartMat = new THREE.MeshBasicMaterial({ color: 0xEE5253, side: THREE.DoubleSide });
    const heartMesh = new THREE.Mesh(heartGeo, heartMat);
    heartMesh.position.set(0, 0.05, 0.015);
    heartMesh.scale.set(0.85, 0.85, 0.85);
    heartMesh.userData = { isTag: true };
    tagGroup.add(heartMesh);

    vaseGroup.add(tagGroup);

    return { gardenRig, vaseGroup, tagGroup, vaseMesh, soilMesh };
}