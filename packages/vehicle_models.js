// -------------------------------------------------------------
// Shared 3D Vehicle Models for Car Race Game
// -------------------------------------------------------------

// Global assets (initialized lazily to ensure THREE is loaded)
let wheelGeometry, wheelMaterial;
let sidewallGeometry, sidewallMaterial;
let rimOuterGeometry, rimMaterial, rimBarrelGeometry;
let hubGeometry, hubMaterial;
let spokeGeometry, spokeMaterial;
let assetsInitialized = false;

function initializeSharedAssets() {
    if (assetsInitialized) return;

    // 1. Wheel Texture
    const wheelCanvas = document.createElement('canvas');
    wheelCanvas.width = 512;
    wheelCanvas.height = 128;
    const ctx = wheelCanvas.getContext('2d');

    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, wheelCanvas.width, wheelCanvas.height);

    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 10;
    for (let x = 0; x < wheelCanvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x + 5, 0);
        ctx.lineTo(x + 25, wheelCanvas.height);
        ctx.stroke();
    }

    ctx.strokeStyle = '#202020';
    ctx.lineWidth = 4;
    for (let y = 10; y < wheelCanvas.height; y += 36) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(wheelCanvas.width, y);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(wheelCanvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);

    // 2. Geometries & Materials
    wheelGeometry = new THREE.CylinderGeometry(2, 2, 3.8, 64, 1, true);
    wheelMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.9,
        metalness: 0.05,
        side: THREE.DoubleSide
    });

    sidewallGeometry = new THREE.RingGeometry(1.35, 2.0, 64);
    sidewallMaterial = new THREE.MeshStandardMaterial({
        color: 0x151515,
        roughness: 0.95,
        metalness: 0.05,
        side: THREE.DoubleSide
    });

    rimOuterGeometry = new THREE.TorusGeometry(1.35, 0.2, 16, 64);
    rimMaterial = new THREE.MeshStandardMaterial({ color: 0xEEEEEE, metalness: 0.95, roughness: 0.12 });
    rimBarrelGeometry = new THREE.CylinderGeometry(1.35, 1.35, 3.1, 32, 1, true);

    hubGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.6, 16);
    hubMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.85, roughness: 0.18 });
    spokeGeometry = new THREE.BoxGeometry(0.12, 1.3, 0.12);
    spokeMaterial = new THREE.MeshStandardMaterial({ color: 0xBBBBBB, metalness: 0.95, roughness: 0.15 });

    assetsInitialized = true;
}

function createWheelAssembly(x, z, y = 1.8) {
    initializeSharedAssets();

    const wheelGroup = new THREE.Group();
    const isLeftWheel = x < 0;
    const outsideDirection = isLeftWheel ? -1 : 1;

    const xFaceOffset = 1.2 * outsideDirection;
    const xBarrelOffset = -0.35 * outsideDirection;

    // 1. Tire Tread (outer cylinder)
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.castShadow = true;
    wheelGroup.add(wheel);

    // 2. Tire Sidewalls
    const outerSidewall = new THREE.Mesh(sidewallGeometry, sidewallMaterial);
    outerSidewall.position.x = 1.9;
    outerSidewall.rotation.y = Math.PI / 2;
    outerSidewall.castShadow = true;
    wheelGroup.add(outerSidewall);

    const innerSidewall = new THREE.Mesh(sidewallGeometry, sidewallMaterial);
    innerSidewall.position.x = -1.9;
    innerSidewall.rotation.y = Math.PI / 2;
    innerSidewall.castShadow = true;
    wheelGroup.add(innerSidewall);

    // 3. Rim Barrel
    const rimBarrel = new THREE.Mesh(rimBarrelGeometry, rimMaterial);
    rimBarrel.position.x = xBarrelOffset;
    rimBarrel.rotation.z = Math.PI / 2;
    rimBarrel.castShadow = true;
    wheelGroup.add(rimBarrel);

    // 4. Outer Rim Torus
    const rim = new THREE.Mesh(rimOuterGeometry, rimMaterial);
    rim.position.x = xFaceOffset;
    rim.rotation.y = Math.PI / 2;
    rim.castShadow = true;
    wheelGroup.add(rim);

    // 5. Hub
    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    hub.position.x = xFaceOffset;
    hub.rotation.z = Math.PI / 2;
    hub.castShadow = true;
    wheelGroup.add(hub);

    // 6. Spokes (radiating outward in YZ plane correctly)
    for (let i = 0; i < 5; i++) {
        const spokeGroup = new THREE.Group();
        spokeGroup.rotation.x = (Math.PI * 2 / 5) * i;

        const spoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
        spoke.position.set(xFaceOffset, 0.65, 0);
        spoke.castShadow = true;

        spokeGroup.add(spoke);
        wheelGroup.add(spokeGroup);
    }

    wheelGroup.position.set(x, y, z);
    return wheelGroup;
}

function createNumberDecalTexture(numberStr, type = 'classic') {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    if (type === 'futuristic') {
        // Futuristic tech block with neon border
        ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
        ctx.fillRect(8, 8, 112, 112);

        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 6;
        ctx.strokeRect(8, 8, 112, 112);

        // Inner tech details (corner notches)
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(4, 4, 12, 12);
        ctx.fillRect(112, 4, 12, 12);
        ctx.fillRect(4, 112, 12, 12);
        ctx.fillRect(112, 112, 12, 12);

        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 76px monospace';
    } else if (type === 'truck') {
        // Orange circular plate with white border and number
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(64, 64, 60, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 76px sans-serif';
    } else {
        // Classic white roundel with black border and number
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(64, 64, 60, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.fillStyle = '#111111';
        ctx.font = 'bold 76px sans-serif';
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(numberStr, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

function createCar(color, scale = 1, numberStr = "07") {
    initializeSharedAssets();

    const carGroup = new THREE.Group();
    const metalMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.8,
        roughness: 0.2
    });

    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x4488ff,
        transparent: true,
        opacity: 0.65,
        metalness: 0.2,
        roughness: 0.1
    });

    // 1. Curvy Lower Body (Extruded YZ profile with tapered front and rear)
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(-7.8, 0.4); // Tapered rear bottom
    bodyShape.quadraticCurveTo(-8.5, 0.8, -8.5, 1.5); // Curves out to bumper protrusion
    bodyShape.quadraticCurveTo(-8.5, 2.2, -8.2, 2.5); // Curves back up to top deck
    bodyShape.quadraticCurveTo(-6.8, 2.7, -5.5, 2.7); // Trunk deck
    bodyShape.lineTo(3.5, 2.7); // Beltline
    bodyShape.quadraticCurveTo(6.5, 2.5, 7.8, 1.7); // Curved hood
    bodyShape.quadraticCurveTo(8.5, 1.0, 7.8, 0.4); // Tapered front bottom nose
    bodyShape.lineTo(-7.8, 0.4);

    const bodyExtrudeSettings = {
        depth: 8.4,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 1,
        bevelSize: 0.15,
        bevelThickness: 0.15
    };
    const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, bodyExtrudeSettings);
    const body = new THREE.Mesh(bodyGeometry, metalMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    body.rotation.y = -Math.PI / 2;
    body.position.x = 4.2; // Center the 8.4 width
    carGroup.add(body);

    // 2. Curvy Cabin/Glass (Extruded YZ profile)
    const cabinShape = new THREE.Shape();
    cabinShape.moveTo(3.5, 2.7);
    cabinShape.quadraticCurveTo(2.2, 4.4, 1.0, 5.1);
    cabinShape.quadraticCurveTo(-0.5, 5.2, -2.0, 5.1);
    cabinShape.quadraticCurveTo(-4.2, 4.4, -5.5, 2.7);
    cabinShape.lineTo(3.5, 2.7);

    const cabinExtrudeSettings = {
        depth: 7.4,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 1,
        bevelSize: 0.1,
        bevelThickness: 0.1
    };
    const cabinGeometry = new THREE.ExtrudeGeometry(cabinShape, cabinExtrudeSettings);
    const cabin = new THREE.Mesh(cabinGeometry, windowMaterial);
    cabin.castShadow = true;
    cabin.rotation.y = -Math.PI / 2;
    cabin.position.x = 3.7; // Center the 7.4 width
    carGroup.add(cabin);

    // 3. Thin Curvy Roof Shell (painted body color)
    const roofShape = new THREE.Shape();
    roofShape.moveTo(1.2, 5.1);
    roofShape.quadraticCurveTo(-0.5, 5.25, -2.2, 5.1);
    roofShape.lineTo(-2.2, 4.95);
    roofShape.quadraticCurveTo(-0.5, 5.1, 1.2, 4.95);
    roofShape.lineTo(1.2, 5.1);

    const roofGeometry = new THREE.ExtrudeGeometry(roofShape, {
        depth: 7.55,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.05,
        bevelThickness: 0.05
    });
    const roof = new THREE.Mesh(roofGeometry, metalMaterial);
    roof.castShadow = true;
    roof.rotation.y = -Math.PI / 2;
    roof.position.x = 3.775;
    carGroup.add(roof);

    // 4. Front splitter
    const bumperGeometry = new THREE.BoxGeometry(8.5, 0.3, 1.2);
    const bumper = new THREE.Mesh(bumperGeometry, metalMaterial);
    bumper.castShadow = true;
    bumper.position.set(0, 0.55, 8.1);
    carGroup.add(bumper);

    // 5. Rear spoiler - double-mount racing wing (lifted higher & slanted)
    const spoilerGroup = new THREE.Group();

    // Wing Mounts (pedestals) - taller & slanted backwards
    const mountMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.3 });
    const mountGeometry = new THREE.BoxGeometry(0.25, 2.4, 0.8);

    const leftMount = new THREE.Mesh(mountGeometry, mountMaterial);
    leftMount.position.set(-3.0, 4.2, -7.75);
    leftMount.rotation.x = -0.3; // Sporty backward slant
    leftMount.castShadow = true;
    spoilerGroup.add(leftMount);

    const rightMount = new THREE.Mesh(mountGeometry, mountMaterial);
    rightMount.position.set(3.0, 4.2, -7.75);
    rightMount.rotation.x = -0.3; // Sporty backward slant
    rightMount.castShadow = true;
    spoilerGroup.add(rightMount);

    // Main Wing Blade - body color
    const wingBladeGeometry = new THREE.BoxGeometry(9.5, 0.2, 2.2);
    const wingBlade = new THREE.Mesh(wingBladeGeometry, metalMaterial);
    wingBlade.position.set(0, 5.4, -8.0);
    wingBlade.rotation.x = 0.12; // Aerodynamic angle
    wingBlade.castShadow = true;
    spoilerGroup.add(wingBlade);

    // Wing Endplates - body color
    const endplateGeometry = new THREE.BoxGeometry(0.1, 1.0, 2.4);

    const leftEndplate = new THREE.Mesh(endplateGeometry, metalMaterial);
    leftEndplate.position.set(-4.75, 5.4, -8.0);
    leftEndplate.rotation.x = 0.12;
    leftEndplate.castShadow = true;
    spoilerGroup.add(leftEndplate);

    const rightEndplate = new THREE.Mesh(endplateGeometry, metalMaterial);
    rightEndplate.position.set(4.75, 5.4, -8.0);
    rightEndplate.rotation.x = 0.12;
    rightEndplate.castShadow = true;
    spoilerGroup.add(rightEndplate);

    carGroup.add(spoilerGroup);

    // Side mirrors
    const mirrorMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.95 });
    const leftMirror = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 1.5), mirrorMaterial);
    leftMirror.position.set(-4.8, 3.2, 2); // Lowered slightly to align with lower beltline
    leftMirror.castShadow = true;
    carGroup.add(leftMirror);

    const rightMirror = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 1.5), mirrorMaterial);
    rightMirror.position.set(4.8, 3.2, 2);
    rightMirror.castShadow = true;
    carGroup.add(rightMirror);

    // =========================================================
    // RACING DECALS (Stripes & Number Plates)
    // =========================================================
    // 1. Center Stripes (double white or black stripes depending on car color)
    const stripeColor = (color === 0xffffff || color === 0xbdc3c7 || color === 0xdfe6e9) ? 0x111111 : 0xffffff;
    const stripeMat = new THREE.MeshStandardMaterial({ color: stripeColor, roughness: 0.2, metalness: 0.1 });

    // Hood stripes
    const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 5.0), stripeMat);
    stripeL.position.set(-0.45, 2.56, 4.6);
    stripeL.rotation.x = -0.16; // slope matching the hood
    carGroup.add(stripeL);

    const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 5.0), stripeMat);
    stripeR.position.set(0.45, 2.56, 4.6);
    stripeR.rotation.x = -0.16;
    carGroup.add(stripeR);

    // Roof stripes
    const roofStripeL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 4.0), stripeMat);
    roofStripeL.position.set(-0.45, 5.15, -0.5);
    carGroup.add(roofStripeL);

    const roofStripeR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 4.0), stripeMat);
    roofStripeR.position.set(0.45, 5.15, -0.5);
    carGroup.add(roofStripeR);

    // Spoiler stripes (style decals on the wing blade)
    const wingStripeL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 2.3), stripeMat);
    wingStripeL.position.set(-3.0, 5.51, -8.0);
    wingStripeL.rotation.x = 0.12; // matching wing angle
    spoilerGroup.add(wingStripeL);

    const wingStripeR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 2.3), stripeMat);
    wingStripeR.position.set(3.0, 5.51, -8.0);
    wingStripeR.rotation.x = 0.12;
    spoilerGroup.add(wingStripeR);

    // 2. Number Plate Decals (circular door and hood plates)
    const numTex = createNumberDecalTexture(numberStr, 'classic');
    const numMat = new THREE.MeshStandardMaterial({ map: numTex, transparent: true });
    const numPlaneGeo = new THREE.PlaneGeometry(2.0, 2.0);

    // Left Door
    const leftNum = new THREE.Mesh(numPlaneGeo, numMat);
    leftNum.position.set(-4.5, 1.8, 0);
    leftNum.rotation.y = -Math.PI / 2;
    carGroup.add(leftNum);

    // Right Door
    const rightNum = new THREE.Mesh(numPlaneGeo, numMat);
    rightNum.position.set(4.5, 1.8, 0);
    rightNum.rotation.y = Math.PI / 2;
    carGroup.add(rightNum);

    // Hood Plate (offset left of center)
    const hoodNum = new THREE.Mesh(numPlaneGeo, numMat);
    hoodNum.position.set(-1.8, 2.56, 4.8);
    hoodNum.rotation.x = -Math.PI / 2;
    hoodNum.rotation.z = Math.PI;
    carGroup.add(hoodNum);

    // Wheels - extended outwards & stretched wheelbase to avoid clipping doors/mirrors
    const wheels = [];
    [[-5.8, 5.5], [5.8, 5.5], [-5.8, -5.5], [5.8, -5.5]].forEach(([wX, wZ]) => {
        const wheelGroup = createWheelAssembly(wX, wZ);
        carGroup.add(wheelGroup);
        wheels.push(wheelGroup);
    });
    carGroup.userData = { wheels };

    // Headlights
    const headlightMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffee, emissive: 0xffff99, emissiveIntensity: 0.6, metalness: 0.3
    });
    const leftHeadlight = new THREE.Mesh(new THREE.CircleGeometry(0.8, 16), headlightMaterial);
    leftHeadlight.position.set(-3, 1.3, 8.1);
    leftHeadlight.rotation.y = 0.15;
    carGroup.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(new THREE.CircleGeometry(0.8, 16), headlightMaterial);
    rightHeadlight.position.set(3, 1.3, 8.1);
    rightHeadlight.rotation.y = -0.15;
    carGroup.add(rightHeadlight);

    // Taillights
    const taillightMaterial = new THREE.MeshStandardMaterial({
        color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 0.5
    });
    const leftTaillight = new THREE.Mesh(new THREE.CircleGeometry(0.7, 16), taillightMaterial);
    leftTaillight.position.set(-3.4, 1.6, -8.55);
    leftTaillight.rotation.y = Math.PI;
    carGroup.add(leftTaillight);

    const rightTaillight = new THREE.Mesh(new THREE.CircleGeometry(0.7, 16), taillightMaterial);
    rightTaillight.position.set(3.4, 1.6, -8.55);
    rightTaillight.rotation.y = Math.PI;
    carGroup.add(rightTaillight);

    carGroup.scale.set(scale, scale, scale);
    return carGroup;
}

function createFuturisticCar(color, scale = 1, numberStr = "99") {
    initializeSharedAssets();

    const carGroup = new THREE.Group();

    // --- Materials ---
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.9,
        roughness: 0.1
    });
    const darkPanelMaterial = new THREE.MeshStandardMaterial({
        color: 0x0a0a0f,
        metalness: 0.8,
        roughness: 0.25
    });
    const canopyMaterial = new THREE.MeshStandardMaterial({
        color: 0x0d1b2a,
        transparent: true,
        opacity: 0.78,
        metalness: 0.7,
        roughness: 0.02
    });
    const neonCyanMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 1.3
    });
    const neonRedMaterial = new THREE.MeshStandardMaterial({
        color: 0xff1133,
        emissive: 0xff0022,
        emissiveIntensity: 1.2
    });
    const underglowMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ccff,
        emissive: 0x0088cc,
        emissiveIntensity: 0.7
    });
    const carbonMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        metalness: 0.6,
        roughness: 0.4
    });

    // =========================================================
    // 1. MAIN BODY — Low, wide wedge with beltline cutout for canopy
    // =========================================================
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(-8.5, 0.3);
    // Rear diffuser curve
    bodyShape.quadraticCurveTo(-9.2, 0.5, -9.2, 1.0);
    // Rear wall rising to rear deck
    bodyShape.quadraticCurveTo(-9.2, 2.6, -8.5, 3.0);
    // Rear deck flat to cabin start (beltline stays at 3.0)
    bodyShape.lineTo(-4.5, 3.0);
    // Cabin beltline stays low — canopy bubbles above this
    bodyShape.lineTo(5.5, 3.0);
    // Hood slopes down from beltline to nose
    bodyShape.quadraticCurveTo(7.0, 2.4, 8.5, 1.5);
    // Nose taper
    bodyShape.quadraticCurveTo(9.5, 0.8, 10.0, 0.5);
    bodyShape.quadraticCurveTo(10.3, 0.3, 10.0, 0.3);
    // Floor
    bodyShape.lineTo(-8.5, 0.3);

    const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, {
        depth: 9.6,
        bevelEnabled: true,
        bevelSegments: 5,
        steps: 1,
        bevelSize: 0.2,
        bevelThickness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    body.rotation.y = -Math.PI / 2;
    body.position.x = 4.8;
    carGroup.add(body);

    // =========================================================
    // 2. DARK UNDERBODY / FLOOR PAN
    // =========================================================
    const floorShape = new THREE.Shape();
    floorShape.moveTo(-8.5, 0.1);
    floorShape.lineTo(10.0, 0.1);
    floorShape.lineTo(10.0, 0.6);
    floorShape.lineTo(-8.5, 0.6);
    floorShape.lineTo(-8.5, 0.1);

    const floorGeometry = new THREE.ExtrudeGeometry(floorShape, {
        depth: 9.8,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.1,
        bevelThickness: 0.05
    });
    const floor = new THREE.Mesh(floorGeometry, darkPanelMaterial);
    floor.castShadow = true;
    floor.rotation.y = -Math.PI / 2;
    floor.position.x = 4.9;
    carGroup.add(floor);

    // =========================================================
    // 3. CANOPY WINDSHIELD (Visible bubble above body beltline)
    // =========================================================
    const canopyShape = new THREE.Shape();
    canopyShape.moveTo(-4.5, 2.9);
    // Rear glass rises steeply
    canopyShape.quadraticCurveTo(-3.5, 4.8, -1.0, 5.2);
    // Roof peak
    canopyShape.quadraticCurveTo(1.0, 5.3, 2.5, 4.8);
    // Windshield rakes forward and down
    canopyShape.quadraticCurveTo(4.5, 3.6, 6.0, 2.9);
    canopyShape.lineTo(-4.5, 2.9);

    const canopyGeometry = new THREE.ExtrudeGeometry(canopyShape, {
        depth: 8.2,
        bevelEnabled: true,
        bevelSegments: 5,
        steps: 1,
        bevelSize: 0.15,
        bevelThickness: 0.15
    });
    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.castShadow = true;
    canopy.rotation.y = -Math.PI / 2;
    canopy.position.x = 4.1;
    carGroup.add(canopy);

    // =========================================================
    // 4. WIDE FENDER ARCHES (Muscular shoulders)
    // =========================================================
    // Front fenders
    const fFenderGeo = new THREE.BoxGeometry(1.2, 1.4, 4.5);
    const fFenderL = new THREE.Mesh(fFenderGeo, bodyMaterial);
    fFenderL.position.set(-5.2, 1.2, 6.0);
    fFenderL.castShadow = true;
    carGroup.add(fFenderL);

    const fFenderR = new THREE.Mesh(fFenderGeo, bodyMaterial);
    fFenderR.position.set(5.2, 1.2, 6.0);
    fFenderR.castShadow = true;
    carGroup.add(fFenderR);

    // Rear fenders (wider, more aggressive)
    const rFenderGeo = new THREE.BoxGeometry(1.4, 1.6, 5.0);
    const rFenderL = new THREE.Mesh(rFenderGeo, bodyMaterial);
    rFenderL.position.set(-5.4, 1.2, -5.5);
    rFenderL.castShadow = true;
    carGroup.add(rFenderL);

    const rFenderR = new THREE.Mesh(rFenderGeo, bodyMaterial);
    rFenderR.position.set(5.4, 1.2, -5.5);
    rFenderR.castShadow = true;
    carGroup.add(rFenderR);

    // =========================================================
    // 5. FRONT SPLITTER (Carbon fiber)
    // =========================================================
    const splitter = new THREE.Mesh(
        new THREE.BoxGeometry(10.0, 0.15, 1.8),
        carbonMaterial
    );
    splitter.position.set(0, 0.25, 9.8);
    splitter.castShadow = true;
    carGroup.add(splitter);

    // =========================================================
    // 6. REAR DIFFUSER (Aggressive aero)
    // =========================================================
    const diffuser = new THREE.Mesh(
        new THREE.BoxGeometry(9.0, 0.15, 2.5),
        carbonMaterial
    );
    diffuser.position.set(0, 0.25, -9.0);
    diffuser.castShadow = true;
    carGroup.add(diffuser);

    // Diffuser fins
    for (let i = -3; i <= 3; i++) {
        const fin = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.6, 2.2),
            carbonMaterial
        );
        fin.position.set(i * 1.2, 0.5, -9.0);
        fin.castShadow = true;
        carGroup.add(fin);
    }

    // =========================================================
    // 7. REAR WING (Low-mounted, integrated)
    // =========================================================
    // Wing mounts
    const wingMountGeo = new THREE.BoxGeometry(0.2, 1.2, 0.6);
    const wingMountL = new THREE.Mesh(wingMountGeo, carbonMaterial);
    wingMountL.position.set(-3.2, 3.6, -8.2);
    wingMountL.rotation.x = -0.15;
    wingMountL.castShadow = true;
    carGroup.add(wingMountL);

    const wingMountR = new THREE.Mesh(wingMountGeo, carbonMaterial);
    wingMountR.position.set(3.2, 3.6, -8.2);
    wingMountR.rotation.x = -0.15;
    wingMountR.castShadow = true;
    carGroup.add(wingMountR);

    // Wing blade
    const wingBlade = new THREE.Mesh(
        new THREE.BoxGeometry(9.5, 0.15, 1.8),
        bodyMaterial
    );
    wingBlade.position.set(0, 4.2, -8.5);
    wingBlade.rotation.x = 0.1;
    wingBlade.castShadow = true;
    carGroup.add(wingBlade);

    // Wing endplates
    const endplateGeo = new THREE.BoxGeometry(0.1, 0.8, 2.0);
    const endplateL = new THREE.Mesh(endplateGeo, bodyMaterial);
    endplateL.position.set(-4.75, 4.2, -8.5);
    endplateL.rotation.x = 0.1;
    endplateL.castShadow = true;
    carGroup.add(endplateL);

    const endplateR = new THREE.Mesh(endplateGeo, bodyMaterial);
    endplateR.position.set(4.75, 4.2, -8.5);
    endplateR.rotation.x = 0.1;
    endplateR.castShadow = true;
    carGroup.add(endplateR);

    // =========================================================
    // 8. NEON LED ACCENT LINES (Middle segment only — between wheel sets)
    // =========================================================
    // Wheels at z=6.5(front, radius 2 → z=4.5..8.5) and z=-6.0(rear, radius 2 → z=-8.0..-4.0)
    // Only middle segment between z=-3.8 and z=4.3 is safe from wheel overlap
    // Upper accents
    const uNeonL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 8.0), neonCyanMaterial);
    uNeonL.position.set(-4.95, 2.2, 0.25);
    carGroup.add(uNeonL);
    const uNeonR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 8.0), neonCyanMaterial);
    uNeonR.position.set(4.95, 2.2, 0.25);
    carGroup.add(uNeonR);
    // Lower accents
    const lNeonL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 8.0), neonCyanMaterial);
    lNeonL.position.set(-4.85, 0.45, 0.25);
    carGroup.add(lNeonL);
    const lNeonR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 8.0), neonCyanMaterial);
    lNeonR.position.set(4.85, 0.45, 0.25);
    carGroup.add(lNeonR);

    // =========================================================
    // 9. FRONT LED LIGHT BAR (Thin blade across full width)
    // =========================================================
    const headlightBar = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.12, 0.12), neonCyanMaterial);
    headlightBar.position.set(0, 0.75, 10.05);
    carGroup.add(headlightBar);

    // DRL accent strip higher up on hood
    const drlStrip = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.06, 0.06), neonCyanMaterial);
    drlStrip.position.set(0, 1.6, 9.6);
    carGroup.add(drlStrip);

    // =========================================================
    // 10. REAR LED TAILLIGHT BAR (Full-width glowing strip)
    // =========================================================
    const tailBar = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.18, 0.15), neonRedMaterial);
    tailBar.position.set(0, 1.8, -9.3);
    carGroup.add(tailBar);

    // Upper brake light strip
    const brakeStrip = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.08, 0.08), neonRedMaterial);
    brakeStrip.position.set(0, 2.8, -9.25);
    carGroup.add(brakeStrip);

    // =========================================================
    // 11. UNDERGLOW (Middle segment only — between wheel sets)
    // =========================================================
    const ugL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 7.5), underglowMaterial);
    ugL.position.set(-3.8, 0.15, 0.25);
    carGroup.add(ugL);
    const ugR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 7.5), underglowMaterial);
    ugR.position.set(3.8, 0.15, 0.25);
    carGroup.add(ugR);

    // =========================================================
    // 12. SIDE MIRRORS (Visible camera pods with stalks)
    // =========================================================
    const mirrorMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 });

    // Left mirror: stalk arm + head
    const stalkL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.15), mirrorMat);
    stalkL.position.set(-5.4, 3.1, 2.5);
    stalkL.castShadow = true;
    carGroup.add(stalkL);
    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 1.2), mirrorMat);
    headL.position.set(-6.0, 3.1, 2.5);
    headL.castShadow = true;
    carGroup.add(headL);

    // Right mirror: stalk arm + head
    const stalkR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.15), mirrorMat);
    stalkR.position.set(5.4, 3.1, 2.5);
    stalkR.castShadow = true;
    carGroup.add(stalkR);
    const headR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 1.2), mirrorMat);
    headR.position.set(6.0, 3.1, 2.5);
    headR.castShadow = true;
    carGroup.add(headR);

    // =========================================================
    // RACING DECALS (Futuristic Neon Digital Plates & Stripe)
    // =========================================================
    // 1. Asymmetrical neon stripe (cyan/magenta glowing strip along the left side of the vehicle)
    const asymStripeMat = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 1.2
    });
    const asymStripe = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 13.0), asymStripeMat);
    asymStripe.position.set(-2.8, 3.12, 0.0);
    carGroup.add(asymStripe);

    // 2. Neon digital number plate decals
    const numTex = createNumberDecalTexture(numberStr, 'futuristic');
    const numMat = new THREE.MeshStandardMaterial({ map: numTex, transparent: true });
    const numPlaneGeo = new THREE.PlaneGeometry(2.0, 2.0);

    // Left Door
    const leftNum = new THREE.Mesh(numPlaneGeo, numMat);
    leftNum.position.set(-5.0, 1.8, 0.0);
    leftNum.rotation.y = -Math.PI / 2;
    carGroup.add(leftNum);

    // Right Door
    const rightNum = new THREE.Mesh(numPlaneGeo, numMat);
    rightNum.position.set(5.0, 1.8, 0.0);
    rightNum.rotation.y = Math.PI / 2;
    carGroup.add(rightNum);

    // Hood Plate (offset left of center)
    const hoodNum = new THREE.Mesh(numPlaneGeo, numMat);
    hoodNum.position.set(-2.0, 3.02, 4.5);
    hoodNum.rotation.x = -Math.PI / 2;
    hoodNum.rotation.z = Math.PI;
    carGroup.add(hoodNum);

    // =========================================================
    // 13. WHEELS (Wider stance)
    // =========================================================
    const wheels = [];
    [[-5.8, 6.5], [5.8, 6.5], [-5.8, -6.0], [5.8, -6.0]].forEach(([wX, wZ]) => {
        const wheelGroup = createWheelAssembly(wX, wZ);
        carGroup.add(wheelGroup);
        wheels.push(wheelGroup);
    });
    carGroup.userData = { wheels };

    carGroup.scale.set(scale, scale, scale);
    return carGroup;
}

function createTruck(colorVal, scale = 1, numberStr = "88") {
    initializeSharedAssets();

    const truckGroup = new THREE.Group();

    // --- Materials ---
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: colorVal,
        metalness: 0.85,
        roughness: 0.15
    });
    const darkTrimMaterial = new THREE.MeshStandardMaterial({
        color: 0x111318,
        metalness: 0.7,
        roughness: 0.35
    });
    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a2a44,
        transparent: true,
        opacity: 0.82,
        metalness: 0.6,
        roughness: 0.05
    });
    const neonCyanMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 1.2
    });
    const neonRedMaterial = new THREE.MeshStandardMaterial({
        color: 0xff2222,
        emissive: 0xff0000,
        emissiveIntensity: 1.0
    });
    const underglowMaterial = new THREE.MeshStandardMaterial({
        color: 0x00cccc,
        emissive: 0x00bbbb,
        emissiveIntensity: 0.6
    });

    // =========================================================
    // 1. SINGLE-VOLUME BODY (Cargo roof high, cab beltline low for windshield)
    // =========================================================
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(-14.0, 0.6);
    // Rear bumper curve up
    bodyShape.quadraticCurveTo(-14.8, 0.8, -14.8, 1.5);
    // Rear wall up to cargo roof
    bodyShape.quadraticCurveTo(-14.8, 5.8, -14.0, 6.2);
    // Cargo roof (flat, long)
    bodyShape.lineTo(4.0, 6.2);
    // Drop from cargo roof down to cab beltline
    bodyShape.quadraticCurveTo(4.5, 3.8, 5.5, 3.5);
    // Cab beltline (flat — windshield sits above this)
    bodyShape.lineTo(11.5, 3.5);
    // Hood slopes down from beltline to nose
    bodyShape.quadraticCurveTo(13.0, 2.0, 14.5, 1.2);
    // Nose taper
    bodyShape.quadraticCurveTo(15.3, 0.8, 15.0, 0.6);
    // Floor
    bodyShape.lineTo(-14.0, 0.6);

    const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, {
        depth: 7.8,
        bevelEnabled: true,
        bevelSegments: 5,
        steps: 1,
        bevelSize: 0.2,
        bevelThickness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    body.rotation.y = -Math.PI / 2;
    body.position.x = 3.9;
    truckGroup.add(body);

    // =========================================================
    // 2. DARK LOWER SKIRT / UNDERBODY PANEL
    // =========================================================
    const skirtShape = new THREE.Shape();
    skirtShape.moveTo(-14.0, 0.3);
    skirtShape.lineTo(15.0, 0.3);
    skirtShape.lineTo(15.0, 1.2);
    skirtShape.quadraticCurveTo(14.0, 1.0, 13.0, 1.0);
    skirtShape.lineTo(-13.5, 1.0);
    skirtShape.quadraticCurveTo(-14.5, 1.0, -14.0, 0.3);

    const skirtGeometry = new THREE.ExtrudeGeometry(skirtShape, {
        depth: 8.0,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.1,
        bevelThickness: 0.1
    });
    const skirt = new THREE.Mesh(skirtGeometry, darkTrimMaterial);
    skirt.castShadow = true;
    skirt.rotation.y = -Math.PI / 2;
    skirt.position.x = 4.0;
    truckGroup.add(skirt);

    // =========================================================
    // 3. WRAP-AROUND WINDSHIELD (Visible bubble above cab beltline)
    // =========================================================
    const glassShape = new THREE.Shape();
    glassShape.moveTo(5.0, 3.4);
    // Rises up steeply from beltline
    glassShape.quadraticCurveTo(5.5, 5.8, 7.0, 6.0);
    // Roof peak
    glassShape.quadraticCurveTo(8.5, 6.1, 10.0, 5.5);
    // Rakes forward and down to hood
    glassShape.quadraticCurveTo(12.0, 4.0, 13.0, 3.0);
    glassShape.lineTo(5.0, 3.4);

    const glassGeometry = new THREE.ExtrudeGeometry(glassShape, {
        depth: 8.0,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 1,
        bevelSize: 0.12,
        bevelThickness: 0.12
    });
    const glass = new THREE.Mesh(glassGeometry, windowMaterial);
    glass.castShadow = true;
    glass.rotation.y = -Math.PI / 2;
    glass.position.x = 4.0;
    truckGroup.add(glass);

    // =========================================================
    // 4. NEON LED ACCENT LINES (Middle segments only — between wheel sets)
    // =========================================================
    // Wheels at z: 11.0, 4.0, -6.5, -11.5 (radius 2 each)
    // Safe zones: z=-4.5..2.0 (between tandem1 & rear cab), z=6.0..9.0 (between cab axles)
    const truckNeonSegs = [
        { z: -1.25, len: 6.0 },   // Between rear tandem and rear cab axle
        { z: 7.5, len: 2.5 }    // Between cab axles
    ];
    truckNeonSegs.forEach(seg => {
        // Upper accents
        const uL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, seg.len), neonCyanMaterial);
        uL.position.set(-4.08, 3.8, seg.z);
        truckGroup.add(uL);
        const uR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, seg.len), neonCyanMaterial);
        uR.position.set(4.08, 3.8, seg.z);
        truckGroup.add(uR);
        // Lower accents
        const lL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, seg.len), neonCyanMaterial);
        lL.position.set(-4.08, 1.05, seg.z);
        truckGroup.add(lL);
        const lR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, seg.len), neonCyanMaterial);
        lR.position.set(4.08, 1.05, seg.z);
        truckGroup.add(lR);
    });

    // =========================================================
    // 6. FRONT LED HEADLIGHT BAR
    // =========================================================
    const headlightBar = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.18, 0.18), neonCyanMaterial);
    headlightBar.position.set(0, 1.0, 15.1);
    truckGroup.add(headlightBar);

    // Slim upper DRL strip
    const drlStrip = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.08, 0.08), neonCyanMaterial);
    drlStrip.position.set(0, 2.6, 14.9);
    truckGroup.add(drlStrip);

    // =========================================================
    // 7. REAR TAILLIGHT BAR + ACCENTS
    // =========================================================
    const rearTailBar = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.2, 0.18), neonRedMaterial);
    rearTailBar.position.set(0, 3.0, -14.9);
    truckGroup.add(rearTailBar);

    // Lower rear reflector strip
    const rearLowerBar = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.12, 0.12), neonRedMaterial);
    rearLowerBar.position.set(0, 1.2, -14.9);
    truckGroup.add(rearLowerBar);

    // =========================================================
    // 8. WHEEL FAIRINGS (Aerodynamic covers around wheel wells)
    // =========================================================
    // Front wheel fairings
    const frontFairingGeo = new THREE.BoxGeometry(0.3, 2.8, 5.5);
    const flFairing = new THREE.Mesh(frontFairingGeo, darkTrimMaterial);
    flFairing.position.set(-3.95, 1.8, 11.0);
    flFairing.castShadow = true;
    truckGroup.add(flFairing);

    const frFairing = new THREE.Mesh(frontFairingGeo, darkTrimMaterial);
    frFairing.position.set(3.95, 1.8, 11.0);
    frFairing.castShadow = true;
    truckGroup.add(frFairing);

    // Rear wheel fairings (larger, covering tandem axles)
    const rearFairingGeo = new THREE.BoxGeometry(0.3, 2.8, 10.0);
    const rlFairing = new THREE.Mesh(rearFairingGeo, darkTrimMaterial);
    rlFairing.position.set(-4.05, 1.8, -9.0);
    rlFairing.castShadow = true;
    truckGroup.add(rlFairing);

    const rrFairing = new THREE.Mesh(rearFairingGeo, darkTrimMaterial);
    rrFairing.position.set(4.05, 1.8, -9.0);
    rrFairing.castShadow = true;
    truckGroup.add(rrFairing);

    // =========================================================
    // 9. UNDERGLOW (Middle segment only — between wheel sets)
    // =========================================================
    const truckUgL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 6.0), underglowMaterial);
    truckUgL.position.set(-3.5, 0.35, -1.25);
    truckGroup.add(truckUgL);
    const truckUgR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 6.0), underglowMaterial);
    truckUgR.position.set(3.5, 0.35, -1.25);
    truckGroup.add(truckUgR);

    // =========================================================
    // 10. SIDE MIRRORS (Compact camera pods)
    // =========================================================
    const mirrorMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.15 });
    const mirrorGeo = new THREE.BoxGeometry(0.4, 0.6, 1.0);

    const leftMirror = new THREE.Mesh(mirrorGeo, mirrorMat);
    leftMirror.position.set(-4.3, 4.2, 7.0);
    leftMirror.castShadow = true;
    truckGroup.add(leftMirror);

    const rightMirror = new THREE.Mesh(mirrorGeo, mirrorMat);
    rightMirror.position.set(4.3, 4.2, 7.0);
    rightMirror.castShadow = true;
    truckGroup.add(rightMirror);

    // =========================================================
    // RACING DECALS (Truck Flame Stripes & Giant Numbers)
    // =========================================================
    // 1. Broad white/bright stripes down the front hood
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
    const centerStripe = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 10.0), stripeMat);
    centerStripe.position.set(0, 3.55, 9.0);
    centerStripe.rotation.x = -0.15; // hood angle
    truckGroup.add(centerStripe);

    // 2. Large yellow circular plates on driver/passenger cabin doors
    const numTex = createNumberDecalTexture(numberStr, 'truck');
    const numMat = new THREE.MeshStandardMaterial({ map: numTex, transparent: true });
    const numPlaneGeo = new THREE.PlaneGeometry(3.2, 3.2);

    // Left Door
    const leftNum = new THREE.Mesh(numPlaneGeo, numMat);
    leftNum.position.set(-4.15, 3.2, 5.0);
    leftNum.rotation.y = -Math.PI / 2;
    truckGroup.add(leftNum);

    // Right Door
    const rightNum = new THREE.Mesh(numPlaneGeo, numMat);
    rightNum.position.set(4.15, 3.2, 5.0);
    rightNum.rotation.y = Math.PI / 2;
    truckGroup.add(rightNum);

    // =========================================================
    // 11. WHEELS (8 Wheels / 4 Axles)
    // =========================================================
    const wheels = [];
    const wheelPositions = [
        // Front Steer Axle
        [-4.2, 11.0], [4.2, 11.0],
        // Rear Cab Drive Axle
        [-4.2, 4.0], [4.2, 4.0],
        // Trailer Tandem Axle 1
        [-4.3, -6.5], [4.3, -6.5],
        // Trailer Tandem Axle 2
        [-4.3, -11.5], [4.3, -11.5]
    ];

    wheelPositions.forEach(([wX, wZ]) => {
        const wheelGroup = createWheelAssembly(wX, wZ, 1.4);
        truckGroup.add(wheelGroup);
        wheels.push(wheelGroup);
    });

    truckGroup.userData = { wheels };
    truckGroup.scale.set(scale, scale, scale);
    return truckGroup;
}

// ============================================================================
// COMMUTER TRAFFIC MODELS (Non-Racey Everyday Vehicles)
// ============================================================================

function createTrafficSedan(color, scale = 1) {
    initializeSharedAssets();

    const sedanGroup = new THREE.Group();
    const metalMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.6,
        roughness: 0.25
    });

    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a2a44,
        transparent: true,
        opacity: 0.75,
        metalness: 0.5,
        roughness: 0.1
    });

    const mirrorMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        metalness: 0.8,
        roughness: 0.3
    });

    // 1. Curvy Lower Body (Extruded YZ profile)
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(-7.0, 0.4); // Tapered rear bottom
    bodyShape.quadraticCurveTo(-7.5, 0.8, -7.5, 1.4); // Curves out to bumper protrusion
    bodyShape.quadraticCurveTo(-7.5, 2.2, -7.0, 2.3); // Curves back up to top deck
    bodyShape.lineTo(-4.0, 2.3); // Trunk deck
    bodyShape.lineTo(2.0, 2.3); // Beltline
    bodyShape.quadraticCurveTo(5.5, 2.1, 7.0, 1.4); // Curved hood
    bodyShape.quadraticCurveTo(7.5, 0.8, 7.0, 0.4); // Tapered front bottom nose
    bodyShape.lineTo(-7.0, 0.4);

    const bodyExtrudeSettings = {
        depth: 8.2,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 1,
        bevelSize: 0.15,
        bevelThickness: 0.15
    };
    const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, bodyExtrudeSettings);
    const body = new THREE.Mesh(bodyGeometry, metalMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    body.rotation.y = -Math.PI / 2;
    body.position.x = 4.1; // Center the 8.2 width
    sedanGroup.add(body);

    // 2. Cabin/Glass (Extruded YZ profile)
    const cabinShape = new THREE.Shape();
    cabinShape.moveTo(2.0, 2.3);
    cabinShape.quadraticCurveTo(1.2, 3.8, 0.2, 4.0);
    cabinShape.quadraticCurveTo(-1.5, 4.1, -3.0, 4.0);
    cabinShape.quadraticCurveTo(-3.8, 3.5, -4.0, 2.3);
    cabinShape.lineTo(2.0, 2.3);

    const cabinExtrudeSettings = {
        depth: 7.2,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 1,
        bevelSize: 0.1,
        bevelThickness: 0.1
    };
    const cabinGeometry = new THREE.ExtrudeGeometry(cabinShape, cabinExtrudeSettings);
    const cabin = new THREE.Mesh(cabinGeometry, windowMaterial);
    cabin.castShadow = true;
    cabin.rotation.y = -Math.PI / 2;
    cabin.position.x = 3.6; // Center the 7.2 width
    sedanGroup.add(cabin);

    // 3. Thin Curvy Roof Shell (painted body color)
    const roofShape = new THREE.Shape();
    roofShape.moveTo(0.2, 4.0);
    roofShape.quadraticCurveTo(-1.5, 4.15, -3.0, 4.0);
    roofShape.lineTo(-3.0, 3.85);
    roofShape.quadraticCurveTo(-1.5, 4.0, 0.2, 3.85);
    roofShape.lineTo(0.2, 4.0);

    const roofGeometry = new THREE.ExtrudeGeometry(roofShape, {
        depth: 7.35,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.05,
        bevelThickness: 0.05
    });
    const roof = new THREE.Mesh(roofGeometry, metalMaterial);
    roof.castShadow = true;
    roof.rotation.y = -Math.PI / 2;
    roof.position.x = 3.675; // Center the 7.35 width
    sedanGroup.add(roof);

    // 4. Side Mirrors
    const leftMirror = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 1.0), mirrorMaterial);
    leftMirror.position.set(-4.2, 2.5, 0.5);
    leftMirror.castShadow = true;
    sedanGroup.add(leftMirror);

    const rightMirror = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 1.0), mirrorMaterial);
    rightMirror.position.set(4.2, 2.5, 0.5);
    rightMirror.castShadow = true;
    sedanGroup.add(rightMirror);

    // 5. Headlights
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffee, emissiveIntensity: 0.5 });
    const flLight = new THREE.Mesh(new THREE.CircleGeometry(0.6, 16), lightMat);
    flLight.position.set(-2.8, 1.4, 7.35);
    flLight.rotation.y = 0.15;
    sedanGroup.add(flLight);
    const frLight = new THREE.Mesh(new THREE.CircleGeometry(0.6, 16), lightMat);
    frLight.position.set(2.8, 1.4, 7.35);
    frLight.rotation.y = -0.15;
    sedanGroup.add(frLight);

    // Taillights
    const tailMat = new THREE.MeshStandardMaterial({ color: 0xaa2222, emissive: 0xaa2222, emissiveIntensity: 0.4 });
    const rlLight = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.1), tailMat);
    rlLight.position.set(-2.8, 1.4, -7.51);
    sedanGroup.add(rlLight);
    const rrLight = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.1), tailMat);
    rrLight.position.set(2.8, 1.4, -7.51);
    sedanGroup.add(rrLight);

    // 6. Wheels (Narrower commuter wheels scaled along X axis)
    const wheels = [];
    [[-4.0, 4.5], [4.0, 4.5], [-4.0, -4.5], [4.0, -4.5]].forEach(([wX, wZ]) => {
        const wheelGroup = createWheelAssembly(wX, wZ, 1.2);
        wheelGroup.scale.x = 0.6; // make them 60% of racing width
        sedanGroup.add(wheelGroup);
        wheels.push(wheelGroup);
    });
    sedanGroup.userData = { wheels };

    sedanGroup.scale.set(scale, scale, scale);
    return sedanGroup;
}

function createTrafficSUV(color, scale = 1) {
    initializeSharedAssets();

    const suvGroup = new THREE.Group();
    const metalMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.5,
        roughness: 0.35
    });

    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a2a44,
        transparent: true,
        opacity: 0.8,
        metalness: 0.5,
        roughness: 0.1
    });

    const blackTrimMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.8
    });

    // 1. Curvy Lower Body (Extruded YZ profile)
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(-7.5, 0.6); // Rear bottom
    bodyShape.quadraticCurveTo(-8.0, 1.0, -8.0, 1.8); // Rear bumper curve
    bodyShape.quadraticCurveTo(-8.0, 2.9, -7.5, 3.0); // Rear deck curve
    bodyShape.lineTo(3.0, 3.0); // Beltline
    bodyShape.quadraticCurveTo(6.0, 2.8, 7.8, 1.8); // Hood curve
    bodyShape.quadraticCurveTo(8.3, 1.1, 7.8, 0.6); // Front bumper curve
    bodyShape.lineTo(-7.5, 0.6);

    const bodyExtrudeSettings = {
        depth: 8.5,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 1,
        bevelSize: 0.15,
        bevelThickness: 0.15
    };
    const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, bodyExtrudeSettings);
    const body = new THREE.Mesh(bodyGeometry, metalMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    body.rotation.y = -Math.PI / 2;
    body.position.x = 4.25; // Center the 8.5 width
    suvGroup.add(body);

    // 2. Cabin/Glass (Extruded YZ profile)
    const cabinShape = new THREE.Shape();
    cabinShape.moveTo(3.0, 3.0);
    cabinShape.quadraticCurveTo(2.2, 4.6, 1.0, 4.8); // Front windshield
    cabinShape.quadraticCurveTo(-2.5, 4.95, -6.5, 4.8); // Sloping roof line
    cabinShape.quadraticCurveTo(-7.2, 4.2, -7.5, 3.0); // Rear hatch slope
    cabinShape.lineTo(3.0, 3.0);

    const cabinExtrudeSettings = {
        depth: 7.6,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 1,
        bevelSize: 0.1,
        bevelThickness: 0.1
    };
    const cabinGeometry = new THREE.ExtrudeGeometry(cabinShape, cabinExtrudeSettings);
    const cabin = new THREE.Mesh(cabinGeometry, windowMaterial);
    cabin.castShadow = true;
    cabin.rotation.y = -Math.PI / 2;
    cabin.position.x = 3.8; // Center the 7.6 width
    suvGroup.add(cabin);

    // 3. Thin Curvy Roof Shell (painted body color)
    const roofShape = new THREE.Shape();
    roofShape.moveTo(1.0, 4.8);
    roofShape.quadraticCurveTo(-2.5, 4.95, -6.5, 4.8);
    roofShape.lineTo(-6.5, 4.65);
    roofShape.quadraticCurveTo(-2.5, 4.8, 1.0, 4.65);
    roofShape.lineTo(1.0, 4.8);

    const roofGeometry = new THREE.ExtrudeGeometry(roofShape, {
        depth: 7.75,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.05,
        bevelThickness: 0.05
    });
    const roof = new THREE.Mesh(roofGeometry, metalMaterial);
    roof.castShadow = true;
    roof.rotation.y = -Math.PI / 2;
    roof.position.x = 3.875; // Center the 7.75 width
    suvGroup.add(roof);

    // 4. Roof Rack (two thin black tubes)
    const rackL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 9.0), blackTrimMaterial);
    rackL.position.set(-3.2, 5.0, -1.5);
    suvGroup.add(rackL);
    const rackR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 9.0), blackTrimMaterial);
    rackR.position.set(3.2, 5.0, -1.5);
    suvGroup.add(rackR);

    // 5. Headlights
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 });
    const flLight = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.1), lightMat);
    flLight.position.set(-2.8, 1.8, 7.81);
    suvGroup.add(flLight);
    const frLight = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.1), lightMat);
    frLight.position.set(2.8, 1.8, 7.81);
    suvGroup.add(frLight);

    // Taillights
    const tailMat = new THREE.MeshStandardMaterial({ color: 0xaa2222, emissive: 0xaa2222, emissiveIntensity: 0.4 });
    const rlLight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.1), tailMat);
    rlLight.position.set(-3.6, 2.8, -7.51);
    suvGroup.add(rlLight);
    const rrLight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.1), tailMat);
    rrLight.position.set(3.6, 2.8, -7.51);
    suvGroup.add(rrLight);

    // 6. Wheels (SUV wheels, slightly larger, scaled narrower in X)
    const wheels = [];
    [[-4.1, 4.8], [4.1, 4.8], [-4.1, -4.8], [4.1, -4.8]].forEach(([wX, wZ]) => {
        const wheelGroup = createWheelAssembly(wX, wZ, 1.4);
        wheelGroup.scale.x = 0.65; // make them 65% of racing width
        suvGroup.add(wheelGroup);
        wheels.push(wheelGroup);
    });
    suvGroup.userData = { wheels };

    suvGroup.scale.set(scale, scale, scale);
    return suvGroup;
}

function createTrafficVan(color, scale = 1) {
    initializeSharedAssets();

    const vanGroup = new THREE.Group();
    const metalMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.4,
        roughness: 0.5
    });

    const windowMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a2a44,
        transparent: true,
        opacity: 0.85,
        metalness: 0.5,
        roughness: 0.1
    });

    // 1. Unified Curvy Van Body (Extruded YZ profile)
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(-8.0, 0.5); // Rear bottom
    bodyShape.quadraticCurveTo(-8.5, 0.8, -8.5, 1.6); // Rear bumper
    bodyShape.lineTo(-8.5, 4.9); // Rear cargo wall
    bodyShape.quadraticCurveTo(-8.5, 5.2, -8.0, 5.2); // Rear roof curve
    bodyShape.lineTo(1.5, 5.2); // Cargo roof line
    bodyShape.quadraticCurveTo(2.0, 4.2, 2.5, 4.0); // Cabin roof transition
    bodyShape.lineTo(4.0, 4.0); // Cabin roof
    bodyShape.lineTo(6.5, 2.5); // Windshield slope
    bodyShape.lineTo(7.5, 2.3); // Hood
    bodyShape.quadraticCurveTo(8.5, 1.8, 8.5, 1.2); // Front bumper curve
    bodyShape.quadraticCurveTo(8.5, 0.6, 7.8, 0.5); // Front nose bottom
    bodyShape.lineTo(-8.0, 0.5);

    const bodyExtrudeSettings = {
        depth: 8.2,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 1,
        bevelSize: 0.15,
        bevelThickness: 0.15
    };
    const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, bodyExtrudeSettings);
    const body = new THREE.Mesh(bodyGeometry, metalMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    body.rotation.y = -Math.PI / 2;
    body.position.x = 4.1; // Center the 8.2 width
    vanGroup.add(body);

    // 2. Windshield (Offset slightly outward to sit proud of body surface)
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(7.6, 2.9, 0.2), windowMaterial);
    windshield.position.set(0, 3.32, 5.32);
    windshield.rotation.x = -Math.atan2(1.5, 2.5);
    vanGroup.add(windshield);

    // 3. Side windows
    const leftWin = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.1, 2.2), windowMaterial);
    leftWin.position.set(-4.11, 3.25, 4.8);
    vanGroup.add(leftWin);

    const rightWin = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.1, 2.2), windowMaterial);
    rightWin.position.set(4.11, 3.25, 4.8);
    vanGroup.add(rightWin);

    // 4. Headlights (Positioned outward at Z = 8.72 to sit proud of beveled bumper curve)
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xeeffee, emissive: 0xeeffee, emissiveIntensity: 0.4 });
    const flLight = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 0.1), lightMat);
    flLight.position.set(-2.8, 1.3, 8.72);
    vanGroup.add(flLight);
    const frLight = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 0.1), lightMat);
    frLight.position.set(2.8, 1.3, 8.72);
    vanGroup.add(frLight);

    // 5. Taillights (Positioned outward at Z = -8.72 and X = 3.5/-3.5 to sit proud of beveled rear cargo wall)
    const tailMat = new THREE.MeshStandardMaterial({ color: 0x992222, emissive: 0x992222, emissiveIntensity: 0.3 });
    const rlLight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.8, 0.1), tailMat);
    rlLight.position.set(-3.5, 2.2, -8.72);
    vanGroup.add(rlLight);
    const rrLight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.8, 0.1), tailMat);
    rrLight.position.set(3.5, 2.2, -8.72);
    vanGroup.add(rrLight);

    // 6. Wheels (Scaled narrower in X)
    const wheels = [];
    [[-4.0, 4.5], [4.0, 4.5], [-4.0, -4.5], [4.0, -4.5]].forEach(([wX, wZ]) => {
        const wheelGroup = createWheelAssembly(wX, wZ, 1.4);
        wheelGroup.scale.x = 0.65; // make them 65% of racing width
        vanGroup.add(wheelGroup);
        wheels.push(wheelGroup);
    });
    vanGroup.userData = { wheels };

    vanGroup.scale.set(scale, scale, scale);
    return vanGroup;
}
