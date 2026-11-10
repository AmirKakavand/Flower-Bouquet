import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { playSproutChime } from './audio';

export const FLOWER_PALETTES = {
    tulips: [0xFF9AA2, 0xFFB7B2, 0xFFDAC1, 0xF8B195],
    daisies: [0xFFFFFF, 0xFFF9F0, 0xFFEEF2],
    lavender: [0xC7B8EA, 0xB5A4E3, 0xD4C5F9],
    hydrangea: [0xA8DADC, 0xC5E8ED, 0xE0BBE4, 0xD291BC]
};

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

const stemMaterial = new THREE.MeshStandardMaterial({
    color: 0x789262,
    roughness: 0.6,
    metalness: 0.05
});

export function createTulipMesh(color: number): THREE.Group {
    const group = new THREE.Group();
    const petalMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.35,
        metalness: 0.05,
        side: THREE.DoubleSide
    });

    const petalGeo = new THREE.SphereGeometry(0.2, 16, 16, 0, Math.PI);
    petalGeo.scale(0.8, 1.4, 0.4);

    // Inner petals
    for (let i = 0; i < 3; i++) {
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.rotation.y = (i * Math.PI * 2) / 3;
        petal.rotation.x = 0.22;
        petal.position.y = 0.15;
        group.add(petal);
    }

    // Outer petals
    for (let i = 0; i < 3; i++) {
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.rotation.y = (i * Math.PI * 2) / 3 + Math.PI / 3;
        petal.rotation.x = 0.35;
        petal.position.y = 0.12;
        petal.scale.set(1.08, 1.08, 1.08);
        group.add(petal);
    }

    const coreGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0xFEE440, roughness: 0.5 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 0.12;
    group.add(core);

    return group;
}

export function createDaisyMesh(): THREE.Group {
    const group = new THREE.Group();

    const centerGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.08, 16);
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xFDB813, roughness: 0.4 });
    const center = new THREE.Mesh(centerGeo, centerMat);
    center.rotation.x = Math.PI / 2;
    group.add(center);

    const dotGeo = new THREE.SphereGeometry(0.025, 6, 6);
    const dotMat = new THREE.MeshStandardMaterial({ color: 0xE28A00, roughness: 0.6 });
    for (let i = 0; i < 6; i++) {
        const dot = new THREE.Mesh(dotGeo, dotMat);
        const ang = (i / 6) * Math.PI * 2;
        dot.position.set(Math.cos(ang) * 0.06, Math.sin(ang) * 0.06, 0.045);
        group.add(dot);
    }

    const petalGeo = new THREE.CylinderGeometry(0.05, 0.02, 0.32, 8);
    petalGeo.scale(1, 1, 0.25);
    petalGeo.translate(0, 0.16, 0);

    const petalMat = new THREE.MeshStandardMaterial({
        color: pick(FLOWER_PALETTES.daisies),
        roughness: 0.25,
        side: THREE.DoubleSide
    });

    const count = 12;
    for (let i = 0; i < count; i++) {
        const petal = new THREE.Mesh(petalGeo, petalMat);
        const theta = (i / count) * Math.PI * 2;
        petal.position.x = Math.cos(theta) * 0.09;
        petal.position.y = Math.sin(theta) * 0.09;
        petal.rotation.z = theta - Math.PI / 2;
        petal.rotation.x = 0.08 * (i % 2 === 0 ? 1 : -1);
        group.add(petal);
    }
    return group;
}

export function createLavenderMesh(): THREE.Group {
    const group = new THREE.Group();
    const budGeo = new THREE.SphereGeometry(0.075, 8, 8);
    const chosenColor = pick(FLOWER_PALETTES.lavender);
    const budMat = new THREE.MeshStandardMaterial({ color: chosenColor, roughness: 0.45 });

    for (let i = 0; i < 11; i++) {
        const ringCount = 3 + (i % 2);
        const yOffset = i * 0.085;
        const taper = Math.max(0.4, 1 - (i * 0.06));

        for (let j = 0; j < ringCount; j++) {
            const bud = new THREE.Mesh(budGeo, budMat);
            const angle = (j / ringCount) * Math.PI * 2 + (i * 0.5);
            bud.position.set(
                Math.cos(angle) * (0.07 * taper),
                yOffset,
                Math.sin(angle) * (0.07 * taper)
            );
            bud.scale.setScalar(taper);
            group.add(bud);
        }
    }
    return group;
}

export function createFluffyBlossomMesh(): THREE.Group {
    const group = new THREE.Group();
    const color = pick(FLOWER_PALETTES.hydrangea);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3 });
    const floretPetalGeo = new THREE.SphereGeometry(0.045, 8, 8);
    floretPetalGeo.scale(1.1, 0.4, 0.8);

    for (let f = 0; f < 7; f++) {
        const floret = new THREE.Group();
        for (let p = 0; p < 4; p++) {
            const petal = new THREE.Mesh(floretPetalGeo, mat);
            petal.rotation.y = (p * Math.PI) / 2;
            petal.position.x = Math.cos((p * Math.PI) / 2) * 0.04;
            petal.position.z = Math.sin((p * Math.PI) / 2) * 0.04;
            floret.add(petal);
        }
        const eye = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 6, 6),
            new THREE.MeshStandardMaterial({ color: 0xFEE440 })
        );
        floret.add(eye);

        if (f === 0) {
            floret.position.set(0, 0.12, 0);
        } else {
            const ang = (f / 6) * Math.PI * 2;
            floret.position.set(Math.cos(ang) * 0.12, 0.06, Math.sin(ang) * 0.12);
            floret.rotation.x = Math.cos(ang) * 0.35;
            floret.rotation.z = Math.sin(ang) * 0.35;
        }
        group.add(floret);
    }
    return group;
}

export function createFlower(): THREE.Group {
    const flowerRig = new THREE.Group();

    const startX = (Math.random() - 0.5) * 0.55;
    const startZ = (Math.random() - 0.5) * 0.55;
    const height = 1.35 + Math.random() * 1.35;
    const bendX = startX + (Math.random() - 0.5) * 1.2;
    const bendZ = startZ + (Math.random() - 0.5) * 1.2;

    const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(startX, 1.05, startZ),
        new THREE.Vector3((startX + bendX) / 2 + (Math.random() - 0.5) * 0.25, 1.05 + height * 0.55, (startZ + bendZ) / 2),
        new THREE.Vector3(bendX, 1.05 + height, bendZ)
    );

    const stemGeo = new THREE.TubeGeometry(curve, 22, 0.032, 8, false);
    const stemMesh = new THREE.Mesh(stemGeo, stemMaterial);
    stemMesh.castShadow = true;
    flowerRig.add(stemMesh);

    // Leaf
    const leafGeo = new THREE.SphereGeometry(0.16, 8, 8);
    leafGeo.scale(0.35, 1.3, 0.12);
    const leafMesh = new THREE.Mesh(leafGeo, stemMaterial);
    leafMesh.position.copy(curve.getPoint(0.42));
    leafMesh.rotation.set(0.4, Math.random() * Math.PI, 0.5);
    flowerRig.add(leafMesh);

    // Variety
    const varieties = ['tulip', 'daisy', 'lavender', 'fluffy'];
    const chosen = pick(varieties);
    let head: THREE.Group;

    if (chosen === 'tulip') head = createTulipMesh(pick(FLOWER_PALETTES.tulips));
    else if (chosen === 'daisy') head = createDaisyMesh();
    else if (chosen === 'lavender') head = createLavenderMesh();
    else head = createFluffyBlossomMesh();

    head.position.copy(curve.getPoint(1.0));
    head.lookAt(curve.getPoint(0.95));
    head.rotateX(Math.PI);
    head.castShadow = true;
    flowerRig.add(head);

    flowerRig.scale.set(0.001, 0.001, 0.001);

    new TWEEN.Tween(flowerRig.scale)
        .to({ x: 1, y: 1, z: 1 }, 750)
        .easing(TWEEN.Easing.Back.Out)
        .start();

    playSproutChime();

    return flowerRig;
}