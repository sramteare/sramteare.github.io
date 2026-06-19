// Void Drifter - Shared 3D Model Factory
// This module contains all mesh creation functions used by both the game and model viewer.
// Edit models here — changes are reflected everywhere.

const VoidModels = (function () {
    'use strict';

    function createShieldMesh(radius, color, detail = 2) {
        const group = new THREE.Group();

        // Use IcosahedronGeometry for a geodesic/faceted forcefield look
        const geo = new THREE.IcosahedronGeometry(radius, detail);

        // 1. Solid glass-like shell with specular reflections
        const glassMat = new THREE.MeshPhongMaterial({
            color: color,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            shininess: 90,
            specular: '#ffffff',
            depthWrite: false
        });
        const glassMesh = new THREE.Mesh(geo, glassMat);
        group.add(glassMesh);

        // 2. Delicate geodesic wireframe overlay (reference retained, but opacity forced to 0 for glassy look)
        const wireMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0,
            wireframe: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const wireMesh = new THREE.Mesh(geo, wireMat);
        group.add(wireMesh);

        // Keep references
        group.glassMesh = glassMesh;
        group.wireMesh = wireMesh;

        // Custom property to proxy opacity setting to children
        Object.defineProperty(group, 'material', {
            get: function () {
                return {
                    get opacity() {
                        return glassMat.opacity;
                    },
                    set opacity(val) {
                        glassMat.opacity = val * 0.6; // Enhanced glassy forcefield flash
                        wireMat.opacity = 0.0;        // Disabled wireframe lines as requested
                    },
                    dispose() {
                        // Dummy dispose to prevent crashes during traversal cleanup
                    }
                };
            },
            configurable: true
        });

        return group;
    }

    // =========================================================================
    //  PLAYER SHIPS
    // =========================================================================

    /** Dispatch: returns the correct ship mesh by type key */
    function createPlayerShipMesh(shipType) {
        switch (shipType) {
            case 'wraith':  return createWraithMesh();
            case 'bastion': return createBastionMesh();
            case 'spectre': return createSpectreMesh();
            default:        return createVanguardMesh();
        }
    }

    // --- Vanguard-7: Balanced fighter (redesigned) ---
    function createVanguardMesh() {
        const group = new THREE.Group();
        const accent = '#00f2ff';

        // --- Materials ---
        const hullMat = new THREE.MeshStandardMaterial({
            color: '#060f24', // Deep space blue
            roughness: 0.25,
            metalness: 0.8,
            emissive: '#002f3f',
        });
        const panelMat = new THREE.MeshStandardMaterial({
            color: '#0b1d3d', // Lighter blue for layered armor panels
            roughness: 0.3,
            metalness: 0.75,
        });
        const darkPanelMat = new THREE.MeshStandardMaterial({
            color: '#030814', // Very dark space navy
            roughness: 0.35,
            metalness: 0.8,
        });
        const lightPanelMat = new THREE.MeshStandardMaterial({
            color: '#102a5c', // Lighter steel blue for accent panels
            roughness: 0.25,
            metalness: 0.75,
        });
        const metalMat = new THREE.MeshStandardMaterial({
            color: '#2d3340', // Engine nozzles / mechanical parts
            roughness: 0.2,
            metalness: 0.9,
        });
        const glowMat = new THREE.MeshBasicMaterial({ color: accent });
        const flameMat = new THREE.MeshBasicMaterial({ color: '#00f2ff', transparent: true, opacity: 0.8 }); // Futuristic cyan ion thrusters

        // --- 1. Faceted Central Fuselage (Main Body) ---
        // A faceted, aerodynamic main hull replacing the original simple cone
        const bodyGroup = new THREE.Group();

        // Main cabin deck
        const cabinGeo = new THREE.CylinderGeometry(3.5, 4.8, 14, 6);
        cabinGeo.rotateZ(-Math.PI / 2);
        cabinGeo.scale(1, 1, 0.7); // Flatten vertically
        const cabin = new THREE.Mesh(cabinGeo, hullMat);
        cabin.position.set(-2, 0, 0);
        bodyGroup.add(cabin);

        // Sleek nose section
        const noseGeo = new THREE.ConeGeometry(3.5, 12, 6);
        noseGeo.rotateZ(-Math.PI / 2);
        noseGeo.scale(1, 1, 0.65); // Flatten even more towards the tip
        const nose = new THREE.Mesh(noseGeo, hullMat);
        nose.position.set(9, 0, 0);
        bodyGroup.add(nose);

        // Raised center spine running along the top body
        const spineGeo = new THREE.BoxGeometry(13, 2, 2.2);
        const spine = new THREE.Mesh(spineGeo, panelMat);
        spine.position.set(-1.5, 0, 1.8);
        bodyGroup.add(spine);

        group.add(bodyGroup);

        // --- 2. Integrated Hexagonal Canopy ---
        // Sleek glowing cockpit integrated directly into the upper deck
        const canopyGeo = new THREE.CylinderGeometry(1.4, 2.2, 5.5, 6);
        canopyGeo.rotateZ(-Math.PI / 2);
        canopyGeo.scale(1.2, 1, 0.7); // Angular profile
        const canopy = new THREE.Mesh(canopyGeo, glowMat);
        canopy.position.set(4.5, 0, 1.35);
        group.add(canopy);

        // --- 3. Custom Trapezoidal Wings (Left and Right) ---
        // Custom geometries with explicit CCW winding to prevent shading artifacts

        // Left Wing Geometry
        const wingLGeo = new THREE.BufferGeometry();
        const wingLVerts = new Float32Array([
             6.0,  3.2,  0.6,  // Vertex 0: Root Front Top
            -13.0,  3.2,  0.6,  // Vertex 1: Root Rear Top
             -8.0, 16.5,  0.15, // Vertex 2: Tip Front Top
            -13.0, 15.5,  0.15, // Vertex 3: Tip Rear Top
             6.0,  3.2, -0.6,  // Vertex 4: Root Front Bottom
            -13.0,  3.2, -0.6,  // Vertex 5: Root Rear Bottom
             -8.0, 16.5, -0.15, // Vertex 6: Tip Front Bottom
            -13.0, 15.5, -0.15  // Vertex 7: Tip Rear Bottom
        ]);
        const wingIndices = [
            0, 2, 1,   1, 2, 3, // Top Face (CCW from above)
            4, 5, 6,   5, 7, 6, // Bottom Face (CCW from below)
            0, 4, 2,   2, 4, 6, // Front Edge Face
            1, 3, 5,   3, 7, 5, // Back Edge Face
            0, 1, 4,   1, 5, 4, // Root Face (joins body)
            2, 6, 3,   3, 6, 7  // Tip Face (outer edge)
        ];
        wingLGeo.setAttribute('position', new THREE.BufferAttribute(wingLVerts, 3));
        wingLGeo.setIndex(wingIndices);
        wingLGeo.computeVertexNormals();
        const wingL = new THREE.Mesh(wingLGeo, hullMat);
        group.add(wingL);

        // Right Wing Geometry
        const wingRGeo = new THREE.BufferGeometry();
        const wingRVerts = new Float32Array([
             6.0, -3.2,  0.6,  // Vertex 0: Root Front Top (y flipped)
            -13.0, -3.2,  0.6,  // Vertex 1: Root Rear Top
             -8.0, -16.5,  0.15, // Vertex 2: Tip Front Top
            -13.0, -15.5,  0.15, // Vertex 3: Tip Rear Top
             6.0, -3.2, -0.6,  // Vertex 4: Root Front Bottom
            -13.0, -3.2, -0.6,  // Vertex 5: Root Rear Bottom
             -8.0, -16.5, -0.15, // Vertex 6: Tip Front Bottom
            -13.0, -15.5, -0.15  // Vertex 7: Tip Rear Bottom
        ]);
        const wingRIndices = [
            0, 1, 2,   1, 3, 2, // Top Face (CCW from above)
            4, 6, 5,   5, 6, 7, // Bottom Face (CCW from below)
            0, 2, 4,   2, 6, 4, // Front Edge Face
            1, 5, 3,   3, 5, 7, // Back Edge Face
            0, 4, 1,   1, 4, 5, // Root Face
            2, 3, 6,   3, 7, 6  // Tip Face
        ];
        wingRGeo.setAttribute('position', new THREE.BufferAttribute(wingRVerts, 3));
        wingRGeo.setIndex(wingRIndices);
        wingRGeo.computeVertexNormals();
        const wingR = new THREE.Mesh(wingRGeo, hullMat);
        group.add(wingR);

        // --- 4. Layered Armor Panels on Wing Tops ---
        // Adds structural depth and contrast

        // Left Armor Panel
        const panelLGeo = new THREE.BufferGeometry();
        const panelLVerts = new Float32Array([
             3.0,  4.2,  0.65, // Root Front
            -11.0,  4.2,  0.65, // Root Rear
             -7.0, 14.0,  0.22, // Tip Front
            -11.0, 13.0,  0.22  // Tip Rear
        ]);
        const panelIndices = [
            0, 2, 1,   1, 2, 3
        ];
        panelLGeo.setAttribute('position', new THREE.BufferAttribute(panelLVerts, 3));
        panelLGeo.setIndex(panelIndices);
        panelLGeo.computeVertexNormals();
        const panelL = new THREE.Mesh(panelLGeo, panelMat);
        group.add(panelL);

        // Right Armor Panel
        const panelRGeo = new THREE.BufferGeometry();
        const panelRVerts = new Float32Array([
             3.0, -4.2,  0.65, // Root Front
            -11.0, -4.2,  0.65, // Root Rear
             -7.0, -14.0,  0.22, // Tip Front
            -11.0, -13.0,  0.22  // Tip Rear
        ]);
        const panelRIndices = [
            0, 1, 2,   1, 3, 2
        ];
        panelRGeo.setAttribute('position', new THREE.BufferAttribute(panelRVerts, 3));
        panelRGeo.setIndex(panelRIndices);
        panelRGeo.computeVertexNormals();
        const panelR = new THREE.Mesh(panelRGeo, panelMat);
        group.add(panelR);

        // --- 5. Neon Glowing Trim Lines ---
        // Accent light lines running along the armor panel borders

        const glowTrimLGeo = new THREE.BufferGeometry();
        const trimLVerts = new Float32Array([
             3.1,  4.3,  0.68,
             2.9,  4.3,  0.68,
            -6.9, 13.9,  0.25,
            -7.1, 13.9,  0.25
        ]);
        glowTrimLGeo.setAttribute('position', new THREE.BufferAttribute(trimLVerts, 3));
        glowTrimLGeo.setIndex([0, 2, 1, 1, 2, 3]);
        glowTrimLGeo.computeVertexNormals();
        const glowTrimL = new THREE.Mesh(glowTrimLGeo, glowMat);
        group.add(glowTrimL);

        const glowTrimRGeo = new THREE.BufferGeometry();
        const trimRVerts = new Float32Array([
             3.1, -4.3,  0.68,
             2.9, -4.3,  0.68,
            -6.9, -13.9,  0.25,
            -7.1, -13.9,  0.25
        ]);
        glowTrimRGeo.setAttribute('position', new THREE.BufferAttribute(trimRVerts, 3));
        glowTrimRGeo.setIndex([0, 1, 2, 1, 3, 2]);
        glowTrimRGeo.computeVertexNormals();
        const glowTrimR = new THREE.Mesh(glowTrimRGeo, glowMat);
        group.add(glowTrimR);

        // Fuselage top spine neon lines (similar to Spectre 1 concept)
        const spineTrimGeo = new THREE.BoxGeometry(10, 0.15, 0.15);
        const spineTrimL = new THREE.Mesh(spineTrimGeo, glowMat);
        spineTrimL.position.set(-2.5, 0.9, 1.9);
        const spineTrimR = spineTrimL.clone();
        spineTrimR.position.set(-2.5, -0.9, 1.9);
        group.add(spineTrimL, spineTrimR);

        // Fuselage underbelly neon lines
        const botSpineTrimGeo = new THREE.BoxGeometry(6, 0.15, 0.15);
        const botSpineTrimL = new THREE.Mesh(botSpineTrimGeo, glowMat);
        botSpineTrimL.position.set(-3.0, 1.1, -1.2);
        const botSpineTrimR = botSpineTrimL.clone();
        botSpineTrimR.position.set(-3.0, -1.1, -1.2);
        group.add(botSpineTrimL, botSpineTrimR);

        // --- 6. Recessed Engine Pods and Mechanical Nozzles ---

        // Left Engine Pod (Faceted Outer Cylinder)
        const enginePodGeo = new THREE.CylinderGeometry(2.3, 2.6, 9, 6);
        enginePodGeo.rotateZ(Math.PI / 2);
        const enginePodL = new THREE.Mesh(enginePodGeo, hullMat);
        enginePodL.position.set(-8.5, 4.2, 0);
        group.add(enginePodL);

        // Right Engine Pod
        const enginePodR = enginePodL.clone();
        enginePodR.position.set(-8.5, -4.2, 0);
        group.add(enginePodR);

        // Metallic Engine Nozzles
        const nozzleGeo = new THREE.CylinderGeometry(2.1, 1.6, 2.5, 6);
        nozzleGeo.rotateZ(Math.PI / 2);
        const nozzleL = new THREE.Mesh(nozzleGeo, metalMat);
        nozzleL.position.set(-14.25, 4.2, 0);
        const nozzleR = nozzleL.clone();
        nozzleR.position.set(-14.25, -4.2, 0);
        group.add(nozzleL, nozzleR);

        // Glow disks inside the combustion chamber (inner nozzle)
        const chamberGlowGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.2, 6);
        chamberGlowGeo.rotateZ(Math.PI / 2);
        const chamberGlowL = new THREE.Mesh(chamberGlowGeo, glowMat);
        chamberGlowL.position.set(-15.1, 4.2, 0);
        const chamberGlowR = chamberGlowL.clone();
        chamberGlowR.position.set(-15.1, -4.2, 0);
        group.add(chamberGlowL, chamberGlowR);

        // --- 7. Canted Vertical Stabilizer Fins ---
        // Rear fins canted outward for high-speed atmospheric flight stability
        const finGeo = new THREE.BufferGeometry();
        const finVerts = new Float32Array([
             3.0, -0.15, -2.0, // Vertex 0
            -3.0, -0.15, -2.0, // Vertex 1
             0.5, -0.15,  2.0, // Vertex 2
            -2.5, -0.15,  2.0, // Vertex 3
             3.0,  0.15, -2.0, // Vertex 4
            -3.0,  0.15, -2.0, // Vertex 5
             0.5,  0.15,  2.0, // Vertex 6
            -2.5,  0.15,  2.0  // Vertex 7
        ]);
        const finIndices = [
            0, 2, 1,   1, 2, 3, // Left Face
            4, 5, 6,   5, 7, 6, // Right Face
            0, 4, 2,   2, 4, 6, // Front Face
            1, 3, 5,   3, 7, 5, // Back Face
            2, 6, 3,   3, 6, 7, // Top Face
            0, 1, 4,   1, 5, 4  // Bottom Face
        ];
        finGeo.setAttribute('position', new THREE.BufferAttribute(finVerts, 3));
        finGeo.setIndex(finIndices);
        finGeo.computeVertexNormals();

        const finL = new THREE.Mesh(finGeo, hullMat);
        finL.position.set(-9.5, 4.0, 3.5);
        finL.rotation.x = 0.15; // Cant outward
        const finR = new THREE.Mesh(finGeo, hullMat);
        finR.position.set(-9.5, -4.0, 3.5);
        finR.rotation.x = -0.15; // Cant outward
        group.add(finL, finR);

        // --- 8. Laser Cannons ---
        // Sleek gun mounts on the wings
        const cannonGeo = new THREE.CylinderGeometry(0.35, 0.35, 4.5, 6);
        cannonGeo.rotateZ(Math.PI / 2);
        const cannonL = new THREE.Mesh(cannonGeo, metalMat);
        cannonL.position.set(-2.0, 8.5, 0.1);
        const cannonR = cannonL.clone();
        cannonR.position.set(-2.0, -8.5, 0.1);
        group.add(cannonL, cannonR);

        // Glowing tips for the cannons
        const cannonGlowGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 6);
        cannonGlowGeo.rotateZ(Math.PI / 2);
        const cannonGlowL = new THREE.Mesh(cannonGlowGeo, glowMat);
        cannonGlowL.position.set(0.35, 8.5, 0.1);
        const cannonGlowR = cannonGlowL.clone();
        cannonGlowR.position.set(0.35, -8.5, 0.1);
        group.add(cannonGlowL, cannonGlowR);

        // --- 9. Futuristic Cyan Ion Flames ---
        const flameGeo = new THREE.ConeGeometry(2.0, 9, 8);
        flameGeo.rotateZ(Math.PI / 2);
        flameGeo.translate(-4.5, 0, 0); // Origin at nozzle attachment point

        const flameRight = new THREE.Mesh(flameGeo, flameMat);
        flameRight.position.set(-15.3, 4.2, 0);
        const flameLeft = flameRight.clone();
        flameLeft.position.set(-15.3, -4.2, 0);
        group.add(flameRight, flameLeft);
        group.flames = [flameRight, flameLeft];

        // --- 10. Underbelly Fuselage Panels (Shades of blue paneling) ---
        const bottomFuselageGroup = new THREE.Group();

        // Forward underbelly plate (dark blue)
        const forwardPlateGeo = new THREE.ConeGeometry(2.4, 10, 6);
        forwardPlateGeo.rotateZ(-Math.PI / 2);
        forwardPlateGeo.scale(1, 1, 0.3);
        const forwardPlate = new THREE.Mesh(forwardPlateGeo, darkPanelMat);
        forwardPlate.position.set(6, 0, -1.0);
        bottomFuselageGroup.add(forwardPlate);

        // Mid underbelly plate (medium blue)
        const midPlateGeo = new THREE.CylinderGeometry(2.4, 3.2, 10, 6);
        midPlateGeo.rotateZ(-Math.PI / 2);
        midPlateGeo.scale(1, 1, 0.4);
        const midPlate = new THREE.Mesh(midPlateGeo, panelMat);
        midPlate.position.set(-2, 0, -1.1);
        bottomFuselageGroup.add(midPlate);

        // Rear underbelly plate (light blue paneling details)
        const rearPlateGeo = new THREE.BoxGeometry(6, 4.2, 0.6);
        const rearPlate = new THREE.Mesh(rearPlateGeo, lightPanelMat);
        rearPlate.position.set(-9, 0, -1.1);
        bottomFuselageGroup.add(rearPlate);

        // Glowing underbelly reactor vent
        const reactorGlowGeo = new THREE.BoxGeometry(4, 1.2, 0.2);
        const reactorGlow = new THREE.Mesh(reactorGlowGeo, glowMat);
        reactorGlow.position.set(-2, 0, -1.35);
        bottomFuselageGroup.add(reactorGlow);

        // Dark metal grill slats over the reactor
        for (let i = -1.5; i <= 1.5; i += 1.0) {
            const slatGeo = new THREE.BoxGeometry(0.25, 1.4, 0.25);
            const slat = new THREE.Mesh(slatGeo, metalMat);
            slat.position.set(-2 + i, 0, -1.38);
            bottomFuselageGroup.add(slat);
        }

        group.add(bottomFuselageGroup);

        // --- 11. Wing Bottom Armor Panels (Layered shades of blue) ---
        // Left Wing Bottom Panel (light blue accent)
        const panelLBotGeo = new THREE.BufferGeometry();
        const panelLBotVerts = new Float32Array([
             3.0,  4.2, -0.65, // Root Front
            -11.0,  4.2, -0.65, // Root Rear
             -7.0, 14.0, -0.22, // Tip Front
            -11.0, 13.0, -0.22  // Tip Rear
        ]);
        panelLBotGeo.setAttribute('position', new THREE.BufferAttribute(panelLBotVerts, 3));
        panelLBotGeo.setIndex([0, 1, 2, 1, 3, 2]); // Winding for bottom-facing normal
        panelLBotGeo.computeVertexNormals();
        const panelLBot = new THREE.Mesh(panelLBotGeo, lightPanelMat);
        group.add(panelLBot);

        // Right Wing Bottom Panel
        const panelRBotGeo = new THREE.BufferGeometry();
        const panelRBotVerts = new Float32Array([
             3.0, -4.2, -0.65, // Root Front
            -11.0, -4.2, -0.65, // Root Rear
             -7.0, -14.0, -0.22, // Tip Front
            -11.0, -13.0, -0.22  // Tip Rear
        ]);
        panelRBotGeo.setAttribute('position', new THREE.BufferAttribute(panelRBotVerts, 3));
        panelRBotGeo.setIndex([0, 2, 1, 1, 2, 3]); // Winding for bottom-facing normal
        panelRBotGeo.computeVertexNormals();
        const panelRBot = new THREE.Mesh(panelRBotGeo, lightPanelMat);
        group.add(panelRBot);

        // Left Wing Bottom Secondary Panel (dark blue detail)
        const panelLBot2Geo = new THREE.BufferGeometry();
        const panelLBot2Verts = new Float32Array([
            -2.0,  6.0, -0.66,
            -10.0,  6.0, -0.66,
            -7.0, 11.0, -0.35,
            -10.0, 10.5, -0.35
        ]);
        panelLBot2Geo.setAttribute('position', new THREE.BufferAttribute(panelLBot2Verts, 3));
        panelLBot2Geo.setIndex([0, 1, 2, 1, 3, 2]);
        panelLBot2Geo.computeVertexNormals();
        const panelLBot2 = new THREE.Mesh(panelLBot2Geo, darkPanelMat);
        group.add(panelLBot2);

        // Right Wing Bottom Secondary Panel
        const panelRBot2Geo = new THREE.BufferGeometry();
        const panelRBot2Verts = new Float32Array([
            -2.0, -6.0, -0.66,
            -10.0, -6.0, -0.66,
            -7.0, -11.0, -0.35,
            -10.0, -10.5, -0.35
        ]);
        panelRBot2Geo.setAttribute('position', new THREE.BufferAttribute(panelRBot2Verts, 3));
        panelRBot2Geo.setIndex([0, 2, 1, 1, 2, 3]);
        panelRBot2Geo.computeVertexNormals();
        const panelRBot2 = new THREE.Mesh(panelRBot2Geo, darkPanelMat);
        group.add(panelRBot2);

        // --- 12. Neon Glowing Trim Lines on the Bottom ---
        const glowTrimLBotGeo = new THREE.BufferGeometry();
        const trimLBotVerts = new Float32Array([
             3.1,  4.3, -0.68,
             2.9,  4.3, -0.68,
            -6.9, 13.9, -0.25,
            -7.1, 13.9, -0.25
        ]);
        glowTrimLBotGeo.setAttribute('position', new THREE.BufferAttribute(trimLBotVerts, 3));
        glowTrimLBotGeo.setIndex([0, 1, 2, 1, 3, 2]);
        glowTrimLBotGeo.computeVertexNormals();
        const glowTrimLBot = new THREE.Mesh(glowTrimLBotGeo, glowMat);
        group.add(glowTrimLBot);

        const glowTrimRBotGeo = new THREE.BufferGeometry();
        const trimRBotVerts = new Float32Array([
             3.1, -4.3, -0.68,
             2.9, -4.3, -0.68,
            -6.9, -13.9, -0.25,
            -7.1, -13.9, -0.25
        ]);
        glowTrimRBotGeo.setAttribute('position', new THREE.BufferAttribute(trimRBotVerts, 3));
        glowTrimRBotGeo.setIndex([0, 2, 1, 1, 2, 3]);
        glowTrimRBotGeo.computeVertexNormals();
        const glowTrimRBot = new THREE.Mesh(glowTrimRBotGeo, glowMat);
        group.add(glowTrimRBot);

        // --- 13. Geodesic Glass Shield ---
        const shield = createShieldMesh(26, accent, 2);
        group.add(shield);
        group.shieldMesh = shield;

        return group;
    }

    // --- Wraith: Sleek arrowhead glass cannon (redesigned) ---
    function createWraithMesh() {
        const group = new THREE.Group();
        const accent = '#b84dff';

        // --- Materials ---
        const hullMat = new THREE.MeshStandardMaterial({
            color: '#0a0418', // Deep space dark purple
            roughness: 0.2,
            metalness: 0.9,
            emissive: '#1a0040',
        });
        const panelMat = new THREE.MeshStandardMaterial({
            color: '#230a45', // Rich dark purple panels
            roughness: 0.25,
            metalness: 0.8,
        });
        const darkPanelMat = new THREE.MeshStandardMaterial({
            color: '#0f0321', // Deep shadow purple
            roughness: 0.35,
            metalness: 0.85,
        });
        const lightPanelMat = new THREE.MeshStandardMaterial({
            color: '#4e178a', // High-contrast violet panels
            roughness: 0.2,
            metalness: 0.75,
        });
        const metalMat = new THREE.MeshStandardMaterial({
            color: '#2d2836', // Engine mechanical parts
            roughness: 0.2,
            metalness: 0.9,
        });
        const glowMat = new THREE.MeshBasicMaterial({ color: accent });
        const flameMat = new THREE.MeshBasicMaterial({ color: '#d280ff', transparent: true, opacity: 0.8 }); // Vibrant violet/magenta engine flames

        // --- 1. Faceted Arrowhead Fuselage (Stealth profile) ---
        const bodyGroup = new THREE.Group();

        // Main body cabin (4-sided squashed cylinder)
        const cabinGeo = new THREE.CylinderGeometry(1.8, 3.2, 18, 4);
        cabinGeo.rotateZ(-Math.PI / 2);
        cabinGeo.scale(1, 1.2, 0.6); // Flatten and widen slightly
        const cabin = new THREE.Mesh(cabinGeo, hullMat);
        cabin.position.set(-4, 0, 0);
        bodyGroup.add(cabin);

        // Elongated, sharp nose cone
        const noseGeo = new THREE.ConeGeometry(1.8, 20, 4);
        noseGeo.rotateZ(-Math.PI / 2);
        noseGeo.scale(1, 1.2, 0.55); // Tapers to a very sharp point
        const nose = new THREE.Mesh(noseGeo, hullMat);
        nose.position.set(10, 0, 0);
        bodyGroup.add(nose);

        // Raised center spine running along the top body
        const spineGeo = new THREE.BoxGeometry(16, 1.2, 1.5);
        const spine = new THREE.Mesh(spineGeo, panelMat);
        spine.position.set(-2, 0, 1.0);
        bodyGroup.add(spine);

        // Dorsal stabilizer fin (matching Concept 2)
        const dorsalFinGeo = new THREE.BufferGeometry();
        const dorsalVerts = new Float32Array([
            -6.0, -0.1, 1.0,  // 0
            -11.0, -0.1, 1.0,  // 1
            -12.0, -0.1, 3.2,  // 2
            -6.0,  0.1, 1.0,  // 3
            -11.0,  0.1, 1.0,  // 4
            -12.0,  0.1, 3.2   // 5
        ]);
        const dorsalIndices = [
            0, 1, 2, // Left Face
            3, 5, 4, // Right Face
            0, 3, 2,  2, 3, 5, // Front Face
            1, 5, 4,  1, 2, 5  // Back Face
        ];
        dorsalFinGeo.setAttribute('position', new THREE.BufferAttribute(dorsalVerts, 3));
        dorsalFinGeo.setIndex(dorsalIndices);
        dorsalFinGeo.computeVertexNormals();
        const dorsalFin = new THREE.Mesh(dorsalFinGeo, hullMat);
        bodyGroup.add(dorsalFin);

        group.add(bodyGroup);

        // --- 2. Integrated Glowing Visor Canopy ---
        // Sleek recessed canopy built directly into the upper deck
        const canopyGeo = new THREE.CylinderGeometry(0.8, 1.3, 6, 4);
        canopyGeo.rotateZ(-Math.PI / 2);
        canopyGeo.scale(1, 1, 0.65);
        const canopy = new THREE.Mesh(canopyGeo, glowMat);
        canopy.position.set(5.5, 0, 0.7);
        group.add(canopy);

        // --- 3. Custom Swept-Back Wings (Left and Right) ---
        // Closed 3D geometries with explicit winding orders

        // Left Wing Geometry
        const wingLGeo = new THREE.BufferGeometry();
        const wingLVerts = new Float32Array([
             5.0,  1.5,  0.4,  // Vertex 0: Front connection
            -14.0, 16.0,  0.05, // Vertex 1: Wingtip Top
             -8.0,  2.2,  0.3,  // Vertex 2: Inner Trailing Edge Top
            -13.0,  1.5,  0.4,  // Vertex 3: Root Rear Top
             5.0,  1.5, -0.4,  // Vertex 4: Bottom Front connection
            -14.0, 16.0, -0.05, // Vertex 5: Wingtip Bottom
             -8.0,  2.2, -0.3,  // Vertex 6: Inner Trailing Edge Bottom
            -13.0,  1.5, -0.4   // Vertex 7: Root Rear Bottom
        ]);
        const wingIndices = [
            0, 1, 2,   0, 2, 3, // Top Faces (CCW from above)
            4, 6, 5,   4, 7, 6, // Bottom Faces (CCW from below)
            0, 4, 1,   1, 4, 5, // Front Leading Edge
            1, 5, 2,   2, 5, 6, // Trailing Notch Edge
            2, 6, 3,   3, 6, 7, // Inner Rear Edge
            0, 3, 4,   3, 7, 4  // Root Face (joins body)
        ];
        wingLGeo.setAttribute('position', new THREE.BufferAttribute(wingLVerts, 3));
        wingLGeo.setIndex(wingIndices);
        wingLGeo.computeVertexNormals();
        const wingL = new THREE.Mesh(wingLGeo, hullMat);
        group.add(wingL);

        // Right Wing Geometry
        const wingRGeo = new THREE.BufferGeometry();
        const wingRVerts = new Float32Array([
             5.0, -1.5,  0.4,  // Vertex 0: Front connection
            -14.0, -16.0,  0.05, // Vertex 1: Wingtip Top
             -8.0, -2.2,  0.3,  // Vertex 2: Inner Trailing Edge Top
            -13.0, -1.5,  0.4,  // Vertex 3: Root Rear Top
             5.0, -1.5, -0.4,  // Vertex 4: Bottom Front connection
            -14.0, -16.0, -0.05, // Vertex 5: Wingtip Bottom
             -8.0, -2.2, -0.3,  // Vertex 6: Inner Trailing Edge Bottom
            -13.0, -1.5, -0.4   // Vertex 7: Root Rear Bottom
        ]);
        const wingRIndices = [
            0, 2, 1,   0, 3, 2, // Top Faces (CCW from above)
            4, 5, 6,   4, 6, 7, // Bottom Faces (CCW from below)
            0, 1, 4,   1, 5, 4, // Front Leading Edge
            1, 2, 5,   2, 6, 5, // Trailing Notch Edge
            2, 3, 6,   3, 7, 6, // Inner Rear Edge
            0, 4, 3,   3, 4, 7  // Root Face
        ];
        wingRGeo.setAttribute('position', new THREE.BufferAttribute(wingRVerts, 3));
        wingRGeo.setIndex(wingRIndices);
        wingRGeo.computeVertexNormals();
        const wingR = new THREE.Mesh(wingRGeo, hullMat);
        group.add(wingR);

        // --- 4. Layered Armor Panels on Wings (Top & Bottom) ---

        // Left Wing Top Panel (light violet)
        const panelLGeo = new THREE.BufferGeometry();
        const panelLVerts = new Float32Array([
             1.0,  2.8,  0.45,
            -11.0, 12.8,  0.15,
             -7.0,  3.2,  0.35
        ]);
        panelLGeo.setAttribute('position', new THREE.BufferAttribute(panelLVerts, 3));
        panelLGeo.setIndex([0, 1, 2]);
        panelLGeo.computeVertexNormals();
        const panelL = new THREE.Mesh(panelLGeo, lightPanelMat);
        group.add(panelL);

        // Right Wing Top Panel
        const panelRGeo = new THREE.BufferGeometry();
        const panelRVerts = new Float32Array([
             1.0, -2.8,  0.45,
            -11.0, -12.8,  0.15,
             -7.0, -3.2,  0.35
        ]);
        panelRGeo.setAttribute('position', new THREE.BufferAttribute(panelRVerts, 3));
        panelRGeo.setIndex([0, 2, 1]);
        panelRGeo.computeVertexNormals();
        const panelR = new THREE.Mesh(panelRGeo, lightPanelMat);
        group.add(panelR);

        // Left Wing Bottom Panel (dark purple for contrast)
        const panelLBotGeo = new THREE.BufferGeometry();
        const panelLBotVerts = new Float32Array([
             1.0,  2.8, -0.45,
            -11.0, 12.8, -0.15,
             -7.0,  3.2, -0.35
        ]);
        panelLBotGeo.setAttribute('position', new THREE.BufferAttribute(panelLBotVerts, 3));
        panelLBotGeo.setIndex([0, 2, 1]);
        panelLBotGeo.computeVertexNormals();
        const panelLBot = new THREE.Mesh(panelLBotGeo, darkPanelMat);
        group.add(panelLBot);

        // Right Wing Bottom Panel
        const panelRBotGeo = new THREE.BufferGeometry();
        const panelRBotVerts = new Float32Array([
             1.0, -2.8, -0.45,
            -11.0, -12.8, -0.15,
             -7.0, -3.2, -0.35
        ]);
        panelRBotGeo.setAttribute('position', new THREE.BufferAttribute(panelRBotVerts, 3));
        panelRBotGeo.setIndex([0, 1, 2]);
        panelRBotGeo.computeVertexNormals();
        const panelRBot = new THREE.Mesh(panelRBotGeo, darkPanelMat);
        group.add(panelRBot);

        // --- 5. Neon Glowing Trim Lines (Top & Bottom) ---
        // Left Wing Top Trim
        const trimLGeo = new THREE.BufferGeometry();
        const trimLVerts = new Float32Array([
             2.0,  2.2,  0.45,
            -12.0, 14.0,  0.12,
            -12.2, 13.8,  0.12,
             1.8,  2.2,  0.45
        ]);
        trimLGeo.setAttribute('position', new THREE.BufferAttribute(trimLVerts, 3));
        trimLGeo.setIndex([0, 1, 2, 0, 2, 3]);
        trimLGeo.computeVertexNormals();
        const trimL = new THREE.Mesh(trimLGeo, glowMat);
        group.add(trimL);

        // Right Wing Top Trim
        const trimRGeo = new THREE.BufferGeometry();
        const trimRVerts = new Float32Array([
             2.0, -2.2,  0.45,
            -12.0, -14.0,  0.12,
            -12.2, -13.8,  0.12,
             1.8, -2.2,  0.45
        ]);
        trimRGeo.setAttribute('position', new THREE.BufferAttribute(trimRVerts, 3));
        trimRGeo.setIndex([0, 2, 1, 0, 3, 2]);
        trimRGeo.computeVertexNormals();
        const trimR = new THREE.Mesh(trimRGeo, glowMat);
        group.add(trimR);

        // Left Wing Bottom Trim
        const trimLBotGeo = new THREE.BufferGeometry();
        const trimLBotVerts = new Float32Array([
             2.0,  2.2, -0.45,
            -12.0, 14.0, -0.12,
            -12.2, 13.8, -0.12,
             1.8,  2.2, -0.45
        ]);
        trimLBotGeo.setAttribute('position', new THREE.BufferAttribute(trimLBotVerts, 3));
        trimLBotGeo.setIndex([0, 2, 1, 0, 3, 2]);
        trimLBotGeo.computeVertexNormals();
        const trimLBot = new THREE.Mesh(trimLBotGeo, glowMat);
        group.add(trimLBot);

        // Right Wing Bottom Trim
        const trimRBotGeo = new THREE.BufferGeometry();
        const trimRBotVerts = new Float32Array([
             2.0, -2.2, -0.45,
            -12.0, -14.0, -0.12,
            -12.2, -13.8, -0.12,
             1.8, -2.2, -0.45
        ]);
        trimRBotGeo.setAttribute('position', new THREE.BufferAttribute(trimRBotVerts, 3));
        trimRBotGeo.setIndex([0, 1, 2, 0, 2, 3]);
        trimRBotGeo.computeVertexNormals();
        const trimRBot = new THREE.Mesh(trimRBotGeo, glowMat);
        group.add(trimRBot);

        // Fuselage top spine neon lines (similar to Spectre 1 concept)
        const spineTrimGeo = new THREE.BoxGeometry(10, 0.12, 0.12);
        const spineTrimL = new THREE.Mesh(spineTrimGeo, glowMat);
        spineTrimL.position.set(-4.0, 0.6, 1.1);
        const spineTrimR = spineTrimL.clone();
        spineTrimR.position.set(-4.0, -0.6, 1.1);
        group.add(spineTrimL, spineTrimR);

        // Fuselage lateral side neon lines
        const sideTrimGeo = new THREE.BoxGeometry(12, 0.12, 0.12);
        const sideTrimL = new THREE.Mesh(sideTrimGeo, glowMat);
        sideTrimL.position.set(0, 1.6, 0.2);
        const sideTrimR = sideTrimL.clone();
        sideTrimR.position.set(0, -1.6, 0.2);
        group.add(sideTrimL, sideTrimR);

        // Fuselage underbelly neon lines
        const botSpineTrimGeo = new THREE.BoxGeometry(8, 0.12, 0.12);
        const botSpineTrimL = new THREE.Mesh(botSpineTrimGeo, glowMat);
        botSpineTrimL.position.set(-4.0, 0.8, -0.85);
        const botSpineTrimR = botSpineTrimL.clone();
        botSpineTrimR.position.set(-4.0, -0.8, -0.85);
        group.add(botSpineTrimL, botSpineTrimR);

        // --- 6. Recessed Engine Pods and Mechanical Nozzles ---
        // Left Engine Pod (Faceted housing)
        const enginePodGeo = new THREE.CylinderGeometry(1.6, 1.8, 6, 5);
        enginePodGeo.rotateZ(Math.PI / 2);
        const enginePodL = new THREE.Mesh(enginePodGeo, hullMat);
        enginePodL.position.set(-9.0, 3.0, 0);
        group.add(enginePodL);

        // Right Engine Pod
        const enginePodR = enginePodL.clone();
        enginePodR.position.set(-9.0, -3.0, 0);
        group.add(enginePodR);

        // Metallic engine nozzles
        const nozzleGeo = new THREE.CylinderGeometry(1.4, 1.1, 2.0, 5);
        nozzleGeo.rotateZ(Math.PI / 2);
        const nozzleL = new THREE.Mesh(nozzleGeo, metalMat);
        nozzleL.position.set(-13.0, 3.0, 0);
        const nozzleR = nozzleL.clone();
        nozzleR.position.set(-13.0, -3.0, 0);
        group.add(nozzleL, nozzleR);

        // Combustion chamber glow disk inside nozzles
        const chamberGlowGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 5);
        chamberGlowGeo.rotateZ(Math.PI / 2);
        const chamberGlowL = new THREE.Mesh(chamberGlowGeo, glowMat);
        chamberGlowL.position.set(-13.9, 3.0, 0);
        const chamberGlowR = chamberGlowL.clone();
        chamberGlowR.position.set(-13.9, -3.0, 0);
        group.add(chamberGlowL, chamberGlowR);

        // --- 7. Underbelly Reactor Core & Panel Details ---
        const bottomFuselageGroup = new THREE.Group();

        // Forward underbelly plate (very dark purple)
        const forwardPlateGeo = new THREE.ConeGeometry(1.2, 12, 4);
        forwardPlateGeo.rotateZ(-Math.PI / 2);
        forwardPlateGeo.scale(1, 1.2, 0.3);
        const forwardPlate = new THREE.Mesh(forwardPlateGeo, darkPanelMat);
        forwardPlate.position.set(8, 0, -0.7);
        bottomFuselageGroup.add(forwardPlate);

        // Rear underbelly casing (light violet)
        const rearCasingGeo = new THREE.BoxGeometry(6, 2.4, 0.5);
        const rearCasing = new THREE.Mesh(rearCasingGeo, lightPanelMat);
        rearCasing.position.set(-8, 0, -0.8);
        bottomFuselageGroup.add(rearCasing);

        // Glowing gravity reactor core
        const reactorGlowGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 4);
        reactorGlowGeo.rotateX(Math.PI / 2);
        const reactorGlow = new THREE.Mesh(reactorGlowGeo, glowMat);
        reactorGlow.position.set(-1, 0, -0.9);
        bottomFuselageGroup.add(reactorGlow);

        // Metallic protective containment slats over reactor
        for (let i = -0.6; i <= 0.6; i += 0.6) {
            const slatGeo = new THREE.BoxGeometry(0.18, 2.6, 0.2);
            const slat = new THREE.Mesh(slatGeo, metalMat);
            slat.position.set(-1 + i, 0, -1.0);
            bottomFuselageGroup.add(slat);
        }

        // Mechanical pipes running along the bottom
        const pipeGeo = new THREE.CylinderGeometry(0.15, 0.15, 8, 4);
        pipeGeo.rotateZ(Math.PI / 2);
        const pipeL = new THREE.Mesh(pipeGeo, metalMat);
        pipeL.position.set(-5.0, 1.2, -0.75);
        const pipeR = pipeL.clone();
        pipeR.position.set(-5.0, -1.2, -0.75);
        bottomFuselageGroup.add(pipeL, pipeR);

        // Ventral stabilizer fin (matching Concept 2)
        const ventralFinGeo = new THREE.BufferGeometry();
        const ventralVerts = new Float32Array([
            -6.0, -0.1, -0.8, // 0
            -11.0, -0.1, -0.8, // 1
            -12.0, -0.1, -2.5, // 2
            -6.0,  0.1, -0.8, // 3
            -11.0,  0.1, -0.8, // 4
            -12.0,  0.1, -2.5  // 5
        ]);
        const ventralIndices = [
            0, 1, 2, // Left Face
            3, 5, 4, // Right Face
            0, 3, 2,  2, 3, 5, // Front Face
            1, 5, 4,  1, 2, 5  // Back Face
        ];
        ventralFinGeo.setAttribute('position', new THREE.BufferAttribute(ventralVerts, 3));
        ventralFinGeo.setIndex(ventralIndices);
        ventralFinGeo.computeVertexNormals();
        const ventralFin = new THREE.Mesh(ventralFinGeo, hullMat);
        bottomFuselageGroup.add(ventralFin);

        // Underbelly nose headlights/sensors (matching Concept 2)
        const headlightGeo = new THREE.BoxGeometry(0.4, 0.4, 0.2);
        const headlightL = new THREE.Mesh(headlightGeo, glowMat);
        headlightL.position.set(12, 0.8, -0.3);
        const headlightR = headlightL.clone();
        headlightR.position.set(12, -0.8, -0.3);
        bottomFuselageGroup.add(headlightL, headlightR);

        group.add(bottomFuselageGroup);

        // --- 8. Purple Ion Thruster Flames ---
        const flameGeo = new THREE.ConeGeometry(1.6, 11, 8);
        flameGeo.rotateZ(Math.PI / 2);
        flameGeo.translate(-5.5, 0, 0); // Origin at nozzle attachment point

        const flR = new THREE.Mesh(flameGeo, flameMat);
        flR.position.set(-14.1, 3, 0);
        const flL = flR.clone();
        flL.position.set(-14.1, -3, 0);
        group.add(flR, flL);
        group.flames = [flR, flL];

        // --- 9. Geodesic Glass Shield ---
        const shield = createShieldMesh(24, accent, 2);
        group.add(shield);
        group.shieldMesh = shield;

        return group;
    }

    // --- Bastion: Heavy armored capsule cruiser ---
    function createBastionMesh() {
        const group = new THREE.Group();
        const accent = '#ff6b00';

        // --- Materials ---
        const hullMat = new THREE.MeshStandardMaterial({
            color: '#1d1b22',
            roughness: 0.45,
            metalness: 0.85,
            emissive: '#0e0b12',
        });
        const armorMat = new THREE.MeshStandardMaterial({
            color: '#5a3b22', // Copper-bronze armor plating
            roughness: 0.35,
            metalness: 0.75,
        });
        const metalMat = new THREE.MeshStandardMaterial({
            color: '#34343a',
            roughness: 0.25,
            metalness: 0.95,
        });
        const glowMat = new THREE.MeshBasicMaterial({ color: accent });

        // --- Curvy Core Fuselage (Horizontal Cylinder + Sphere Caps) ---
        const coreGeo = new THREE.CylinderGeometry(5.5, 5.5, 20, 16);
        coreGeo.rotateZ(Math.PI / 2);
        const core = new THREE.Mesh(coreGeo, hullMat);
        group.add(core);

        const capGeo = new THREE.SphereGeometry(5.5, 16, 16);
        const capFront = new THREE.Mesh(capGeo, hullMat);
        capFront.position.set(10, 0, 0);
        const capBack = new THREE.Mesh(capGeo, hullMat);
        capBack.position.set(-10, 0, 0);
        group.add(capFront, capBack);

        // Command Bridge (glowing hemispherical dome canopy)
        const domeGeo = new THREE.SphereGeometry(4.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        domeGeo.rotateX(Math.PI / 2); // Rotate to stand upright on Z
        const dome = new THREE.Mesh(domeGeo, glowMat);
        dome.position.set(-2, 0, 4.5);
        group.add(dome);

        // Bridge canopy frame (metallic band wrapping the dome)
        const frameGeo = new THREE.TorusGeometry(4.7, 0.6, 8, 16, Math.PI);
        frameGeo.rotateX(Math.PI / 2);
        const frame = new THREE.Mesh(frameGeo, armorMat);
        frame.position.set(-2, 0, 4.5);
        group.add(frame);

        // --- Nose Prow (Elongated Squashed Sphere) ---
        const noseGeo = new THREE.SphereGeometry(6.5, 16, 16);
        noseGeo.scale(2.2, 0.9, 0.7); // Elongate along X, squash along Z and Y
        const nose = new THREE.Mesh(noseGeo, armorMat);
        nose.position.set(16, 0, 0);
        group.add(nose);

        // Curved armor ribs wrapping the core (Torus bands)
        const ribGeo = new THREE.TorusGeometry(5.8, 1.0, 8, 24, Math.PI);
        ribGeo.rotateY(Math.PI / 2);
        const rib1 = new THREE.Mesh(ribGeo, armorMat);
        rib1.position.set(4, 0, 0.2);
        const rib2 = rib1.clone();
        rib2.position.set(-6, 0, 0.2);
        group.add(rib1, rib2);

        // --- Heavy Dual Artillery Cannons ---
        const gunBaseGeo = new THREE.CylinderGeometry(2, 2, 8, 8);
        gunBaseGeo.rotateZ(Math.PI / 2);
        const gunBase = new THREE.Mesh(gunBaseGeo, metalMat);
        gunBase.position.set(8, 0, 3.5);
        group.add(gunBase);

        const barrelGeo = new THREE.CylinderGeometry(1.0, 1.0, 18, 8);
        barrelGeo.rotateZ(Math.PI / 2);
        
        const barrelR = new THREE.Mesh(barrelGeo, metalMat);
        barrelR.position.set(16, 2.5, 3.5);
        const barrelL = barrelR.clone();
        barrelL.position.set(16, -2.5, 3.5);
        group.add(barrelR, barrelL);

        // Cannon Tips (glowing orange vents)
        const tipGeo = new THREE.CylinderGeometry(1.2, 1.2, 2, 8);
        tipGeo.rotateZ(Math.PI / 2);
        const tipR = new THREE.Mesh(tipGeo, glowMat);
        tipR.position.set(25, 2.5, 3.5);
        const tipL = tipR.clone();
        tipL.position.set(25, -2.5, 3.5);
        group.add(tipR, tipL);

        // --- Side Outriggers (Capsule Sponsons) ---
        const sponsonTubeGeo = new THREE.CylinderGeometry(2.5, 2.5, 16, 12);
        sponsonTubeGeo.rotateZ(Math.PI / 2);
        const sponsonR = new THREE.Mesh(sponsonTubeGeo, armorMat);
        sponsonR.position.set(-2, 9.5, 0);
        const sponsonL = sponsonR.clone();
        sponsonL.position.set(-2, -9.5, 0);
        group.add(sponsonR, sponsonL);

        const sponsonCapGeo = new THREE.SphereGeometry(2.5, 12, 12);
        const capRF = new THREE.Mesh(sponsonCapGeo, armorMat); capRF.position.set(6, 9.5, 0);
        const capLF = capRF.clone(); capLF.position.set(6, -9.5, 0);
        const capRB = capRF.clone(); capRB.position.set(-10, 9.5, 0);
        const capLB = capRF.clone(); capLB.position.set(-10, -9.5, 0);
        group.add(capRF, capLF, capRB, capLB);

        // Curved rings wrapping the sponsons
        const outriggerRingGeo = new THREE.TorusGeometry(2.8, 0.5, 8, 16);
        outriggerRingGeo.rotateY(Math.PI / 2);
        const outriggerRingR = new THREE.Mesh(outriggerRingGeo, metalMat);
        outriggerRingR.position.set(-2, 9.5, 0);
        const outriggerRingL = outriggerRingR.clone();
        outriggerRingL.position.set(-2, -9.5, 0);
        group.add(outriggerRingR, outriggerRingL);

        // Glow strips on sides
        const trimGeo = new THREE.BoxGeometry(12, 0.6, 2);
        const trimR = new THREE.Mesh(trimGeo, glowMat);
        trimR.position.set(-2, 12.1, 0);
        const trimL = trimR.clone();
        trimL.position.set(-2, -12.1, 0);
        group.add(trimR, trimL);

        // --- Heavy Quad Thruster Array ---
        const engineGeo = new THREE.CylinderGeometry(2.2, 1.8, 5, 8);
        engineGeo.rotateZ(Math.PI / 2);
        
        const engR1 = new THREE.Mesh(engineGeo, metalMat); engR1.position.set(-14, 4.5, 2);
        const engL1 = engR1.clone(); engL1.position.set(-14, -4.5, 2);
        const engR2 = engR1.clone(); engR2.position.set(-14, 4.5, -2);
        const engL2 = engR1.clone(); engL2.position.set(-14, -4.5, -2);
        group.add(engR1, engL1, engR2, engL2);

        // --- Quad Flames ---
        const flameGeo = new THREE.ConeGeometry(2.2, 8, 8);
        flameGeo.rotateZ(Math.PI / 2);
        flameGeo.translate(-4, 0, 0);
        const flameMat = new THREE.MeshBasicMaterial({ color: '#ff5500', transparent: true, opacity: 0.8 });
        
        const flR1 = new THREE.Mesh(flameGeo, flameMat); flR1.position.set(-16.5, 4.5, 2);
        const flL1 = flR1.clone(); flL1.position.set(-16.5, -4.5, 2);
        const flR2 = flR1.clone(); flR2.position.set(-16.5, 4.5, -2);
        const flL2 = flR1.clone(); flL2.position.set(-16.5, -4.5, -2);
        
        group.add(flR1, flL1, flR2, flL2);
        group.flames = [flR1, flL1, flR2, flL2];

        // --- Geodesic Glass Shield ---
        const shield = createShieldMesh(34, accent, 2);
        group.add(shield);
        group.shieldMesh = shield;

        return group;
    }

    // --- Spectre: Angular stealth diamond with shield emitter (redesigned) ---
    function createSpectreMesh() {
        const group = new THREE.Group();
        const accent = '#00ff88';

        // --- Materials ---
        const hullMat = new THREE.MeshStandardMaterial({
            color: '#001a0d', // Deep space dark emerald
            roughness: 0.2,
            metalness: 0.9,
            emissive: '#002a10',
        });
        const panelMat = new THREE.MeshStandardMaterial({
            color: '#053d20', // Layered dark green armor panels
            roughness: 0.25,
            metalness: 0.8,
        });
        const darkPanelMat = new THREE.MeshStandardMaterial({
            color: '#010f08', // Deepest forest green shadow panels
            roughness: 0.35,
            metalness: 0.85,
        });
        const lightPanelMat = new THREE.MeshStandardMaterial({
            color: '#0bdc75', // Vibrant emerald green accent panels
            roughness: 0.25,
            metalness: 0.7,
        });
        const metalMat = new THREE.MeshStandardMaterial({
            color: '#2a3630', // Mechanical engine parts
            roughness: 0.2,
            metalness: 0.9,
        });
        const glowMat = new THREE.MeshBasicMaterial({ color: accent });
        const flameMat = new THREE.MeshBasicMaterial({ color: '#00ff88', transparent: true, opacity: 0.8 }); // Green thruster flames
        const domeMat = new THREE.MeshStandardMaterial({
            color: accent, emissive: '#004422',
            roughness: 0.15, metalness: 0.7, transparent: true, opacity: 0.7
        });

        // --- 1. Main Diamond-Shaped Fuselage ---
        const bodyGeo = new THREE.BufferGeometry();
        const bv = new Float32Array([
            12.0,   0.0,  0.5,  // Vertex 0: Front Nose Recess Center
             0.0,  10.5,  0.4,  // Vertex 1: Left Body Corner
           -14.0,   0.0,  0.6,  // Vertex 2: Tail Center Tip
             0.0, -10.5,  0.4,  // Vertex 3: Right Body Corner
            12.0,   0.0, -0.5,  // Vertex 4: Bottom Center Recess
             0.0,  10.5, -0.4,  // Vertex 5: Bottom Left Corner
           -14.0,   0.0, -0.6,  // Vertex 6: Bottom Tail Tip
             0.0, -10.5, -0.4   // Vertex 7: Bottom Right Corner
        ]);
        bodyGeo.setAttribute('position', new THREE.BufferAttribute(bv, 3));
        bodyGeo.setIndex([
            0, 1, 2,   0, 2, 3,  // Top Faces (CCW)
            4, 6, 5,   4, 7, 6,  // Bottom Faces (CCW)
            0, 5, 1,   0, 4, 5,  // Left Front Face
            1, 6, 2,   1, 5, 6,  // Left Rear Face
            2, 7, 3,   2, 6, 7,  // Right Rear Face
            3, 4, 0,   3, 7, 4   // Right Front Face
        ]);
        bodyGeo.computeVertexNormals();
        const body = new THREE.Mesh(bodyGeo, hullMat);
        group.add(body);

        // --- 2. Prominent Front Prow Teeth (Concept 1 prongs - pulled back to emerge from body) ---
        // Left Tooth Prong
        const toothLGeo = new THREE.BufferGeometry();
        const toothLVerts = new Float32Array([
            8.0,  3.5,  0.5,  // 0: Root Outer Top (sitting on body edge at X=8)
            8.0,  0.5,  0.5,  // 1: Root Inner Top
            15.5,  2.3,  0.2,  // 2: Tip Top
            8.0,  3.5, -0.5,  // 3: Root Outer Bottom
            8.0,  0.5, -0.5,  // 4: Root Inner Bottom
            15.5,  2.3, -0.2   // 5: Tip Bottom
        ]);
        toothLGeo.setAttribute('position', new THREE.BufferAttribute(toothLVerts, 3));
        toothLGeo.setIndex([
            0, 1, 2, // Top Face (CCW)
            3, 5, 4, // Bottom Face (CCW)
            0, 3, 2,  2, 3, 5, // Outer Face
            1, 5, 2,  1, 4, 5  // Inner Face
        ]);
        toothLGeo.computeVertexNormals();
        const toothL = new THREE.Mesh(toothLGeo, hullMat);
        group.add(toothL);

        // Right Tooth Prong
        const toothRGeo = new THREE.BufferGeometry();
        const toothRVerts = new Float32Array([
            8.0, -3.5,  0.5,  // 0: Root Outer Top (sitting on body edge at X=8)
            8.0, -0.5,  0.5,  // 1: Root Inner Top
            15.5, -2.3,  0.2,  // 2: Tip Top
            8.0, -3.5, -0.5,  // 3: Root Outer Bottom
            8.0, -0.5, -0.5,  // 4: Root Inner Bottom
            15.5, -2.3, -0.2   // 5: Tip Bottom
        ]);
        toothRGeo.setAttribute('position', new THREE.BufferAttribute(toothRVerts, 3));
        toothRGeo.setIndex([
            0, 2, 1, // Top Face (CCW)
            3, 4, 5, // Bottom Face (CCW)
            0, 3, 2,  2, 3, 5, // Outer Face
            1, 5, 2,  1, 4, 5  // Inner Face
        ]);
        toothRGeo.computeVertexNormals();
        const toothR = new THREE.Mesh(toothRGeo, hullMat);
        group.add(toothR);

        // --- 3. Integrated Visor Canopy (Windshield nested behind the prongs) ---
        const canopyGeo = new THREE.CylinderGeometry(1.0, 1.6, 5, 6);
        canopyGeo.rotateZ(-Math.PI / 2);
        canopyGeo.scale(1.2, 1, 0.65);
        const canopy = new THREE.Mesh(canopyGeo, glowMat);
        canopy.position.set(9.0, 0, 0.8);
        group.add(canopy);

        // --- 4. Central Shield Emitter Dome & Base Ring console ---
        // Solid mechanical ring console (made smaller to fit the new dome)
        const consoleGeo = new THREE.CylinderGeometry(2.6, 3.0, 1.0, 8);
        consoleGeo.rotateX(Math.PI / 2);
        consoleGeo.scale(1, 1, 0.7);
        const consoleRing = new THREE.Mesh(consoleGeo, panelMat);
        consoleRing.position.set(1.5, 0, 0.65);
        group.add(consoleRing);

        // Nested glowing dome (Outer glass shield - made smaller)
        const domeGeo = new THREE.SphereGeometry(2.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        domeGeo.rotateX(Math.PI / 2);
        const glassMat = new THREE.MeshStandardMaterial({
            color: '#a3ffc9', // Pale green tint glass
            roughness: 0.05,
            metalness: 0.95,
            transparent: true,
            opacity: 0.35,
            emissive: '#003311'
        });
        const dome = new THREE.Mesh(domeGeo, glassMat);
        dome.position.set(1.5, 0, 0.65);
        group.add(dome);

        // Inner dotty lit ball (Particle core inside the glass)
        const coreGeo = new THREE.SphereGeometry(1.4, 10, 8);
        const coreMat = new THREE.PointsMaterial({
            color: accent,
            size: 0.45,
            transparent: true,
            opacity: 0.9
        });
        const corePoints = new THREE.Points(coreGeo, coreMat);
        corePoints.position.set(1.5, 0, 0.65);
        group.add(corePoints);

        // --- 5. Layered Armor Panels (Top & Bottom) ---
        // Top Left Panel (Medium Green)
        const panelLGeo = new THREE.BufferGeometry();
        const panelLVerts = new Float32Array([
            10.0,  1.5,  0.55,
             2.0,  8.5,  0.45,
           -10.0,  1.0,  0.65
        ]);
        panelLGeo.setAttribute('position', new THREE.BufferAttribute(panelLVerts, 3));
        panelLGeo.setIndex([0, 1, 2]);
        panelLGeo.computeVertexNormals();
        const panelL = new THREE.Mesh(panelLGeo, panelMat);
        group.add(panelL);

        // Top Right Panel
        const panelRGeo = new THREE.BufferGeometry();
        const panelRVerts = new Float32Array([
            10.0, -1.5,  0.55,
             2.0, -8.5,  0.45,
           -10.0, -1.0,  0.65
        ]);
        panelRGeo.setAttribute('position', new THREE.BufferAttribute(panelRVerts, 3));
        panelRGeo.setIndex([0, 2, 1]);
        panelRGeo.computeVertexNormals();
        const panelR = new THREE.Mesh(panelRGeo, panelMat);
        group.add(panelR);

        // Bottom Left Panel (Dark Green)
        const panelLBotGeo = new THREE.BufferGeometry();
        const panelLBotVerts = new Float32Array([
            10.0,  1.5, -0.55,
             2.0,  8.5, -0.45,
           -10.0,  1.0, -0.65
        ]);
        panelLBotGeo.setAttribute('position', new THREE.BufferAttribute(panelLBotVerts, 3));
        panelLBotGeo.setIndex([0, 2, 1]);
        panelLBotGeo.computeVertexNormals();
        const panelLBot = new THREE.Mesh(panelLBotGeo, darkPanelMat);
        group.add(panelLBot);

        // Bottom Right Panel
        const panelRBotGeo = new THREE.BufferGeometry();
        const panelRBotVerts = new Float32Array([
            10.0, -1.5, -0.55,
             2.0, -8.5, -0.45,
           -10.0, -1.0, -0.65
        ]);
        panelRBotGeo.setAttribute('position', new THREE.BufferAttribute(panelRBotVerts, 3));
        panelRBotGeo.setIndex([0, 1, 2]);
        panelRBotGeo.computeVertexNormals();
        const panelRBot = new THREE.Mesh(panelRBotGeo, darkPanelMat);
        group.add(panelRBot);

        // --- 6. Glowing Neon Trim Lines (Top & Bottom) ---
        // Top Left Seam
        const trimLGeo = new THREE.BufferGeometry();
        const trimLVerts = new Float32Array([
            10.5,  1.4,  0.55,
            10.0,  1.4,  0.55,
             0.0,  9.5,  0.42,
            -0.2,  9.3,  0.42
        ]);
        trimLGeo.setAttribute('position', new THREE.BufferAttribute(trimLVerts, 3));
        trimLGeo.setIndex([0, 2, 1, 1, 2, 3]);
        trimLGeo.computeVertexNormals();
        const trimL = new THREE.Mesh(trimLGeo, glowMat);
        group.add(trimL);

        // Top Right Seam
        const trimRGeo = new THREE.BufferGeometry();
        const trimRVerts = new Float32Array([
            10.5, -1.4,  0.55,
            10.0, -1.4,  0.55,
             0.0, -9.5,  0.42,
            -0.2, -9.3,  0.42
        ]);
        trimRGeo.setAttribute('position', new THREE.BufferAttribute(trimRVerts, 3));
        trimRGeo.setIndex([0, 1, 2, 1, 3, 2]);
        trimRGeo.computeVertexNormals();
        const trimR = new THREE.Mesh(trimRGeo, glowMat);
        group.add(trimR);

        // Bottom Left Seam
        const trimLBotGeo = new THREE.BufferGeometry();
        const trimLBotVerts = new Float32Array([
            10.5,  1.4, -0.55,
            10.0,  1.4, -0.55,
             0.0,  9.5, -0.42,
            -0.2,  9.3, -0.42
        ]);
        trimLBotGeo.setAttribute('position', new THREE.BufferAttribute(trimLBotVerts, 3));
        trimLBotGeo.setIndex([0, 1, 2, 1, 3, 2]);
        trimLBotGeo.computeVertexNormals();
        const trimLBot = new THREE.Mesh(trimLBotGeo, glowMat);
        group.add(trimLBot);

        // Bottom Right Seam
        const trimRBotGeo = new THREE.BufferGeometry();
        const trimRBotVerts = new Float32Array([
            10.5, -1.4, -0.55,
            10.0, -1.4, -0.55,
             0.0, -9.5, -0.42,
            -0.2, -9.3, -0.42
        ]);
        trimRBotGeo.setAttribute('position', new THREE.BufferAttribute(trimRBotVerts, 3));
        trimRBotGeo.setIndex([0, 2, 1, 1, 2, 3]);
        trimRBotGeo.computeVertexNormals();
        const trimRBot = new THREE.Mesh(trimRBotGeo, glowMat);
        group.add(trimRBot);

        // Fuselage top spine neon lines (similar to Spectre 1 concept)
        const spineTrimGeo = new THREE.BoxGeometry(11, 0.12, 0.12);
        const spineTrimL = new THREE.Mesh(spineTrimGeo, glowMat);
        spineTrimL.position.set(-2.0, 0.8, 1.15);
        const spineTrimR = spineTrimL.clone();
        spineTrimR.position.set(-2.0, -0.8, 1.15);
        group.add(spineTrimL, spineTrimR);

        // Top Left Body Diagonal Glow Seam
        const diagTrimLGeo = new THREE.BufferGeometry();
        const diagLVerts = new Float32Array([
            8.0, 1.6, 0.56,
            8.0, 1.4, 0.56,
            2.0, 6.1, 0.48,
            2.0, 5.9, 0.48
        ]);
        diagTrimLGeo.setAttribute('position', new THREE.BufferAttribute(diagLVerts, 3));
        diagTrimLGeo.setIndex([0, 2, 1, 1, 2, 3]);
        diagTrimLGeo.computeVertexNormals();
        const diagTrimL = new THREE.Mesh(diagTrimLGeo, glowMat);
        group.add(diagTrimL);

        // Top Right Body Diagonal Glow Seam
        const diagTrimRGeo = new THREE.BufferGeometry();
        const diagRVerts = new Float32Array([
            8.0, -1.6, 0.56,
            8.0, -1.4, 0.56,
            2.0, -6.1, 0.48,
            2.0, -5.9, 0.48
        ]);
        diagTrimRGeo.setAttribute('position', new THREE.BufferAttribute(diagRVerts, 3));
        diagTrimRGeo.setIndex([0, 1, 2, 1, 3, 2]);
        diagTrimRGeo.computeVertexNormals();
        const diagTrimR = new THREE.Mesh(diagTrimRGeo, glowMat);
        group.add(diagTrimR);

        // Bottom Left Body Diagonal Glow Seam
        const diagTrimLBotGeo = new THREE.BufferGeometry();
        const diagLBotVerts = new Float32Array([
            8.0, 1.6, -0.56,
            8.0, 1.4, -0.56,
            2.0, 6.1, -0.48,
            2.0, 5.9, -0.48
        ]);
        diagTrimLBotGeo.setAttribute('position', new THREE.BufferAttribute(diagLBotVerts, 3));
        diagTrimLBotGeo.setIndex([0, 1, 2, 1, 3, 2]); // Reversed winding for bottom
        diagTrimLBotGeo.computeVertexNormals();
        const diagTrimLBot = new THREE.Mesh(diagTrimLBotGeo, glowMat);
        group.add(diagTrimLBot);

        // Bottom Right Body Diagonal Glow Seam
        const diagTrimRBotGeo = new THREE.BufferGeometry();
        const diagRBotVerts = new Float32Array([
            8.0, -1.6, -0.56,
            8.0, -1.4, -0.56,
            2.0, -6.1, -0.48,
            2.0, -5.9, -0.48
        ]);
        diagTrimRBotGeo.setAttribute('position', new THREE.BufferAttribute(diagRBotVerts, 3));
        diagTrimRBotGeo.setIndex([0, 2, 1, 1, 2, 3]);
        diagTrimRBotGeo.computeVertexNormals();
        const diagTrimRBot = new THREE.Mesh(diagTrimRBotGeo, glowMat);
        group.add(diagTrimRBot);

        // --- 7. Underbelly Reactor Core Grid slats & conduits ---
        const bottomFuselageGroup = new THREE.Group();

        // Glowing green power core
        const reactorGlowGeo = new THREE.BoxGeometry(3.5, 1.5, 0.2);
        const reactorGlow = new THREE.Mesh(reactorGlowGeo, glowMat);
        reactorGlow.position.set(-2, 0, -0.7);
        bottomFuselageGroup.add(reactorGlow);

        // Metal slats
        for (let i = -1.2; i <= 1.2; i += 0.8) {
            const slatGeo = new THREE.BoxGeometry(0.2, 1.7, 0.25);
            const slat = new THREE.Mesh(slatGeo, metalMat);
            slat.position.set(-2 + i, 0, -0.75);
            bottomFuselageGroup.add(slat);
        }

        // Mechanical pipes
        const pipeGeo = new THREE.CylinderGeometry(0.12, 0.12, 10, 4);
        pipeGeo.rotateZ(Math.PI / 2);
        const pipeL = new THREE.Mesh(pipeGeo, metalMat);
        pipeL.position.set(-5, 1.0, -0.6);
        const pipeR = pipeL.clone();
        pipeR.position.set(-5, -1.0, -0.6);
        bottomFuselageGroup.add(pipeL, pipeR);

        group.add(bottomFuselageGroup);

        // --- 8. Triple Engine Array Pods & Nozzles ---
        // Center Engine Pod
        const engineCGeo = new THREE.CylinderGeometry(2.0, 2.2, 7, 6);
        engineCGeo.rotateZ(Math.PI / 2);
        const engC = new THREE.Mesh(engineCGeo, hullMat);
        engC.position.set(-10, 0, 0.3);
        group.add(engC);

        // Left Engine Pod
        const engineLGeo = new THREE.CylinderGeometry(1.6, 1.8, 6, 6);
        engineLGeo.rotateZ(Math.PI / 2);
        const engL = new THREE.Mesh(engineLGeo, hullMat);
        engL.position.set(-9, 4.5, 0.2);
        group.add(engL);

        // Right Engine Pod
        const engR = engL.clone();
        engR.position.set(-9, -4.5, 0.2);
        group.add(engR);

        // Mechanical metal nozzles
        const nozzleGeo = new THREE.CylinderGeometry(1.8, 1.4, 2.5, 6);
        nozzleGeo.rotateZ(Math.PI / 2);
        const nozzleC = new THREE.Mesh(nozzleGeo, metalMat);
        nozzleC.position.set(-14.75, 0, 0.3);
        const nozzleL = new THREE.Mesh(nozzleGeo, metalMat);
        nozzleL.position.set(-13.25, 4.5, 0.2);
        const nozzleR = nozzleL.clone();
        nozzleR.position.set(-13.25, -4.5, 0.2);
        group.add(nozzleC, nozzleL, nozzleR);

        // Combustion glows inside engines
        const chamberGlowCGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.2, 6);
        chamberGlowCGeo.rotateZ(Math.PI / 2);
        const chamberGlowC = new THREE.Mesh(chamberGlowCGeo, glowMat);
        chamberGlowC.position.set(-15.6, 0, 0.3);
        const chamberGlowLGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 6);
        chamberGlowLGeo.rotateZ(Math.PI / 2);
        const chamberGlowL = new THREE.Mesh(chamberGlowLGeo, glowMat);
        chamberGlowL.position.set(-14.1, 4.5, 0.2);
        const chamberGlowR = chamberGlowL.clone();
        chamberGlowR.position.set(-14.1, -4.5, 0.2);
        group.add(chamberGlowC, chamberGlowL, chamberGlowR);

        // --- 9. Triple Engine Green Flames ---
        const flameCGeo = new THREE.ConeGeometry(1.8, 9, 8);
        flameCGeo.rotateZ(Math.PI / 2);
        flameCGeo.translate(-4.5, 0, 0);
        const flC = new THREE.Mesh(flameCGeo, flameMat);
        flC.position.set(-15.8, 0, 0.3);

        const flameLGeo = new THREE.ConeGeometry(1.4, 7, 8);
        flameLGeo.rotateZ(Math.PI / 2);
        flameLGeo.translate(-3.5, 0, 0);
        const flL = new THREE.Mesh(flameLGeo, flameMat);
        flL.position.set(-14.3, 4.5, 0.2);
        const flR = flL.clone();
        flR.position.set(-14.3, -4.5, 0.2);

        group.add(flC, flL, flR);
        group.flames = [flC, flL, flR];

        // --- 10. Geodesic Glass Shield ---
        const shield = createShieldMesh(26, accent, 2);
        group.add(shield);
        group.shieldMesh = shield;

        return group;
    }

    // =========================================================================
    //  SPACE STATION
    // =========================================================================

    function createSpaceStationMesh() {
        const group = new THREE.Group();

        const coreGeo = new THREE.SphereGeometry(30, 24, 24);
        const coreMat = new THREE.MeshStandardMaterial({
            color: '#e0faff',
            emissive: '#00f2ff',
            emissiveIntensity: 1.5,
            roughness: 0.1
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);

        const shellGeo = new THREE.SphereGeometry(60, 24, 24);
        const shellMat = new THREE.MeshStandardMaterial({
            color: '#0a1a3a',
            transparent: true,
            opacity: 0.3,
            wireframe: true
        });
        const shell = new THREE.Mesh(shellGeo, shellMat);
        group.add(shell);

        const ringGeo = new THREE.TorusGeometry(80, 4, 8, 48);
        const ringMat = new THREE.MeshStandardMaterial({
            color: '#00f2ff',
            roughness: 0.3,
            metalness: 0.8
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        group.add(ring);

        const panelGroup = new THREE.Group();
        const panelGeo = new THREE.BoxGeometry(45, 12, 2);
        const panelMat = new THREE.MeshStandardMaterial({
            color: '#030815',
            roughness: 0.2,
            metalness: 0.8,
            emissive: '#003344'
        });

        const strutGeo = new THREE.CylinderGeometry(1.5, 1.5, 30);
        strutGeo.rotateZ(Math.PI / 2);
        const strutMat = new THREE.MeshStandardMaterial({ color: '#555555', metalness: 0.9 });

        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            const itemGroup = new THREE.Group();
            
            const panel = new THREE.Mesh(panelGeo, panelMat);
            panel.position.set(90, 0, 0);
            
            const lineGeo = new THREE.BoxGeometry(43, 1, 2.2);
            const lineMat = new THREE.MeshBasicMaterial({ color: '#00f2ff' });
            const line1 = new THREE.Mesh(lineGeo, lineMat);
            line1.position.set(90, 3, 0);
            const line2 = new THREE.Mesh(lineGeo, lineMat);
            line2.position.set(90, -3, 0);
            itemGroup.add(line1, line2);

            const strut = new THREE.Mesh(strutGeo, strutMat);
            strut.position.set(45, 0, 0);

            itemGroup.add(panel, strut);
            itemGroup.rotation.z = angle;
            
            panelGroup.add(itemGroup);
        }
        group.add(panelGroup);
        group.solarPanels = panelGroup;

        group.turretMeshes = [];
        group.updateTurrets = (count) => {
            if (group.turretMeshes.length === count) return;
            group.turretMeshes.forEach(t => group.remove(t));
            group.turretMeshes = [];

            for (let i = 0; i < count; i++) {
                const turretAngle = i * (Math.PI * 2 / count);
                const turretGroup = new THREE.Group();
                
                const baseGeo = new THREE.CylinderGeometry(5, 5, 4, 8);
                baseGeo.rotateX(Math.PI / 2);
                const baseMat = new THREE.MeshStandardMaterial({ color: '#404050', metalness: 0.8 });
                const base = new THREE.Mesh(baseGeo, baseMat);
                turretGroup.add(base);

                const barrelGeo = new THREE.CylinderGeometry(1.2, 1.2, 12, 8);
                barrelGeo.rotateX(Math.PI / 2);
                barrelGeo.translate(0, 0, 6);
                const barrelMat = new THREE.MeshBasicMaterial({ color: '#00f2ff' });
                const barrel = new THREE.Mesh(barrelGeo, barrelMat);
                turretGroup.add(barrel);

                turretGroup.position.set(Math.cos(turretAngle) * 80, Math.sin(turretAngle) * 80, 0);
                turretGroup.rotation.z = turretAngle;

                group.add(turretGroup);
                group.turretMeshes.push(turretGroup);
            }
        };

        const shield = createShieldMesh(110, '#00f2ff', 3);
        group.add(shield);
        group.shieldMesh = shield;

        return group;
    }

    // =========================================================================
    //  ENEMIES
    // =========================================================================

    function createEnemyMesh(type) {
        const group = new THREE.Group();

        if (type === 'swarmer') {
            const swarmerGroup = new THREE.Group();

            // Materials (Evil Dark & Crimson Red Theme)
            const hullMat = new THREE.MeshStandardMaterial({
                color: '#151518', // Deep space-obsidian grey
                roughness: 0.35,
                metalness: 0.85,
                emissive: '#440003' // Menacing dark crimson under-glow
            });

            const panelMat = new THREE.MeshStandardMaterial({
                color: '#2c0c0f', // Dark blood red layered panels
                roughness: 0.45,
                metalness: 0.75,
                emissive: '#180002'
            });

            const nozzleMat = new THREE.MeshStandardMaterial({
                color: '#0d0e10', // Pitch black metallic iron thruster housings
                roughness: 0.3,
                metalness: 0.95
            });

            const glowMat = new THREE.MeshBasicMaterial({ color: '#ff0033' }); // Laser crimson glow
            
            // Fiery thruster flame layer materials
            const coreFlameMat = new THREE.MeshBasicMaterial({ color: '#ffffff' }); // White hot core
            const midFlameMat = new THREE.MeshBasicMaterial({ color: '#ff6600', transparent: true, opacity: 0.85 }); // Mid orange flame
            const glowFlameMat = new THREE.MeshBasicMaterial({
                color: '#ff0033', // Deep crimson red outer glow
                transparent: true,
                opacity: 0.45,
                blending: THREE.AdditiveBlending
            });

            // 1. Crescent Wing Shape (Elliptical design, thick in middle, tapering to sharp tips)
            const shape = new THREE.Shape();
            const shapeSteps = 16;
            
            // Outer curve: y from -18 to 18, x_outer(y) = 10 * (1 - sqrt(1 - (y/18)^2))
            shape.moveTo(10 * (1 - Math.sqrt(1 - (-18/18)**2)), -18);
            for (let i = -shapeSteps + 1; i <= shapeSteps; i++) {
                const u = i / shapeSteps;
                const y = 18 * u;
                const x = 10 * (1 - Math.sqrt(1 - u * u));
                shape.lineTo(x, y);
            }
            
            // Inner curve: y from 18 back to -18, x_inner(y) = 8 + 2 * (|y|/18)
            for (let i = shapeSteps - 1; i >= -shapeSteps; i--) {
                const u = i / shapeSteps;
                const y = 18 * u;
                const absU = Math.abs(u);
                const x = 8 + 2 * absU;
                shape.lineTo(x, y);
            }

            const extrudeSettings = {
                depth: 0.2,
                bevelEnabled: true,
                bevelSegments: 3,
                steps: 1,
                bevelSize: 0.6,
                bevelThickness: 1.2
            };
            const wingGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            wingGeo.center(); // Center around origin (0,0,0) (shifts vertices by -5 on X)
            
            const mainWing = new THREE.Mesh(wingGeo, hullMat);
            swarmerGroup.add(mainWing);

            // 2. Central Mechanical Cockpit Pod (Predatory "Face" in middle of inner curve)
            const cockpitGroup = new THREE.Group();
            
            // Cockpit base
            const cockpitBaseGeo = new THREE.BoxGeometry(5.0, 3.5, 2.0);
            const cockpitBase = new THREE.Mesh(cockpitBaseGeo, panelMat);
            cockpitBase.position.set(1.0, 0, 0.8);
            cockpitGroup.add(cockpitBase);

            // Slanted canopy/armor hood on top
            const canopyGeo = new THREE.ConeGeometry(1.6, 4.0, 4);
            canopyGeo.rotateZ(-Math.PI / 2); // Point forward (+X)
            canopyGeo.scale(1, 0.7, 1.4); // Flatten vertically
            const canopy = new THREE.Mesh(canopyGeo, hullMat);
            canopy.position.set(2.0, 0, 1.3);
            cockpitGroup.add(canopy);

            // Menacing Forehead Crest / Fin (character horn)
            const crestGeo = new THREE.ConeGeometry(0.4, 4.5, 3);
            crestGeo.rotateX(Math.PI / 2); // Vertical fin
            crestGeo.rotateZ(Math.PI / 6); // Slant backward
            const crest = new THREE.Mesh(crestGeo, hullMat);
            crest.position.set(1.2, 0, 2.3);
            cockpitGroup.add(crest);

            // Menacing Dual Slit Eyes (Crimson glow)
            const eyeGeo = new THREE.BoxGeometry(0.4, 1.1, 0.4);
            
            const leftEye = new THREE.Mesh(eyeGeo, glowMat);
            leftEye.position.set(3.4, 0.7, 1.2);
            leftEye.rotation.y = 0.2;
            leftEye.rotation.z = 0.35; // Angled menacingly down-forward
            cockpitGroup.add(leftEye);

            const rightEye = new THREE.Mesh(eyeGeo, glowMat);
            rightEye.position.set(3.4, -0.7, 1.2);
            rightEye.rotation.y = -0.2;
            rightEye.rotation.z = -0.35; // Symmetrically angled
            cockpitGroup.add(rightEye);

            // Mechanical gun barrels sticking out forward
            const gunGeo = new THREE.CylinderGeometry(0.18, 0.18, 2.8, 6);
            gunGeo.rotateZ(Math.PI / 2); // Length along X
            
            const leftGun = new THREE.Mesh(gunGeo, nozzleMat);
            leftGun.position.set(3.8, 1.2, 0);
            cockpitGroup.add(leftGun);

            const rightGun = new THREE.Mesh(gunGeo, nozzleMat);
            rightGun.position.set(3.8, -1.2, 0);
            cockpitGroup.add(rightGun);

            // Robotic Mandibles / Fangs (Curved pincers on the mouth)
            const fangGeo = new THREE.ConeGeometry(0.35, 3.2, 4);
            fangGeo.rotateZ(Math.PI / 2); // Point forward
            
            const leftFang = new THREE.Mesh(fangGeo, nozzleMat);
            leftFang.position.set(4.0, 1.6, 0.1);
            leftFang.rotation.z = 0.45; // Curved inwards towards centerline
            cockpitGroup.add(leftFang);

            const rightFang = new THREE.Mesh(fangGeo, nozzleMat);
            rightFang.position.set(4.0, -1.6, 0.1);
            rightFang.rotation.z = -0.45; // Curved inwards towards centerline
            cockpitGroup.add(rightFang);

            swarmerGroup.add(cockpitGroup);

            // 3. Engine Nozzles and Flame Plumes (Distributed along the outer curve)
            const nozzleGeo = new THREE.CylinderGeometry(0.8, 1.2, 2.2, 6);
            nozzleGeo.rotateZ(Math.PI / 2); // Length along X
            
            const fireGeo = new THREE.ConeGeometry(0.8, 4.0, 6);
            fireGeo.rotateZ(-Math.PI / 2); // Point backward along -X

            const thrusters = [
                { x: -6.0, y: 0, scale: 1.2, flameOffset: -2.5 },   // Center
                { x: -5.4, y: 6, scale: 0.95, flameOffset: -2.0 },  // Mid-Left
                { x: -3.4, y: 12, scale: 0.75, flameOffset: -1.5 }, // Far-Left
                { x: -5.4, y: -6, scale: 0.95, flameOffset: -2.0 }, // Mid-Right
                { x: -3.4, y: -12, scale: 0.75, flameOffset: -1.5 } // Far-Right
            ];

            thrusters.forEach(t => {
                const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
                nozzle.position.set(t.x, t.y, 0);
                nozzle.scale.set(t.scale, t.scale, t.scale);
                swarmerGroup.add(nozzle);

                // 1. Hot White Flame Core (roaring from the exhaust chamber)
                const coreFlame = new THREE.Mesh(fireGeo, coreFlameMat);
                coreFlame.position.set(t.x + t.flameOffset + 1.2, t.y, 0);
                coreFlame.scale.set(t.scale * 0.3, t.scale * 0.3, t.scale * 0.5);
                swarmerGroup.add(coreFlame);

                // 2. Mid Orange Flame
                const midFlame = new THREE.Mesh(fireGeo, midFlameMat);
                midFlame.position.set(t.x + t.flameOffset + 0.6, t.y, 0);
                midFlame.scale.set(t.scale * 0.75, t.scale * 0.75, t.scale * 0.85);
                swarmerGroup.add(midFlame);

                // 3. Outer Crimson Volumetric Glow (Additive Blending)
                const outerFlame = new THREE.Mesh(fireGeo, glowFlameMat);
                outerFlame.position.set(t.x + t.flameOffset, t.y, 0);
                outerFlame.scale.set(t.scale * 1.15, t.scale * 1.15, t.scale * 1.15);
                swarmerGroup.add(outerFlame);
            });

            // 4. Panel Plating for Wing Detail (Symmetric)
            const plateGeo = new THREE.BoxGeometry(4.0, 2.2, 0.6);
            
            // Mid-wing plates
            const plateMidL = new THREE.Mesh(plateGeo, panelMat);
            plateMidL.position.set(-0.4, 6, 1.2);
            plateMidL.rotation.z = 0.55;
            swarmerGroup.add(plateMidL);

            const plateMidR = new THREE.Mesh(plateGeo, panelMat);
            plateMidR.position.set(-0.4, -6, 1.2);
            plateMidR.rotation.z = -0.55;
            swarmerGroup.add(plateMidR);

            // Outer-wing plates
            const plateOuterL = new THREE.Mesh(plateGeo, panelMat);
            plateOuterL.position.set(0.9, 12, 1.2);
            plateOuterL.rotation.z = 0.55;
            plateOuterL.scale.set(0.8, 0.8, 1);
            swarmerGroup.add(plateOuterL);

            const plateOuterR = new THREE.Mesh(plateGeo, panelMat);
            plateOuterR.position.set(0.9, -12, 1.2);
            plateOuterR.rotation.z = -0.55;
            plateOuterR.scale.set(0.8, 0.8, 1);
            swarmerGroup.add(plateOuterR);

            // Forward mechanical spikes/antennae on the wings
            const spikeGeo = new THREE.CylinderGeometry(0.15, 0.3, 5, 4);
            spikeGeo.rotateZ(Math.PI / 2); // Length along X
            
            const wingSpikeL = new THREE.Mesh(spikeGeo, nozzleMat);
            wingSpikeL.position.set(5.0, 9, 0.5);
            wingSpikeL.rotation.z = 0.55;
            swarmerGroup.add(wingSpikeL);

            const wingSpikeR = new THREE.Mesh(spikeGeo, nozzleMat);
            wingSpikeR.position.set(5.0, -9, 0.5);
            swarmerGroup.add(wingSpikeR);

            // Scale the group down so it feels like a small, agile scout unit relative to player ships
            swarmerGroup.scale.set(0.65, 0.65, 0.65);

            group.add(swarmerGroup);
        } else if (type === 'bomber') {
            const bomberGroup = new THREE.Group();

            // Materials (Hive Weaver - Faceted Hard-Shell Theme)
            const shellMat = new THREE.MeshStandardMaterial({
                color: '#e58e26', // Warm polished golden-amber bronze
                roughness: 0.25,
                metalness: 0.9,
                emissive: '#4d1e02', // Warm orange emissive underglow
                flatShading: true // Faceted flat shading for armored plates
            });

            const underbellyMat = new THREE.MeshStandardMaterial({
                color: '#151718', // Deep space-charcoal
                roughness: 0.45,
                metalness: 0.7,
                flatShading: true
            });

            const nozzleMat = new THREE.MeshStandardMaterial({
                color: '#0e0f10', // Cast iron engine housings
                roughness: 0.35,
                metalness: 0.95
            });

            const glowMat = new THREE.MeshBasicMaterial({ color: '#ff7700' }); // Intense glowing orange
            const eyeMat = new THREE.MeshBasicMaterial({ color: '#ff1100' }); // Glowing crimson red
            
            // Volumetric orange/red engine flame layers
            const coreFlameMat = new THREE.MeshBasicMaterial({ color: '#ffffff' }); // White-hot core
            const midFlameMat = new THREE.MeshBasicMaterial({ color: '#ff6600', transparent: true, opacity: 0.85 }); // Bright orange flame
            const glowFlameMat = new THREE.MeshBasicMaterial({
                color: '#e63b00', // Deep red-orange outer glow
                transparent: true,
                opacity: 0.45,
                blending: THREE.AdditiveBlending
            });

            // 1. Segmented Thorax & Abdomen Body (Faceted/Low-Poly Hard Shells)
            const bodyGroup = new THREE.Group();
            bomberGroup.add(bodyGroup);

            // Thorax (mid-front body)
            const thoraxGeo = new THREE.SphereGeometry(2.8, 8, 6);
            thoraxGeo.scale(1.25, 1.6, 1.35); // wider and taller for a bulkier look
            const thorax = new THREE.Mesh(thoraxGeo, shellMat);
            thorax.position.set(1.8, 0, 0.5);
            bodyGroup.add(thorax);

            // Abdomen Segment 1 (large center segment)
            const abd1Geo = new THREE.SphereGeometry(3.2, 8, 6);
            abd1Geo.scale(1.35, 1.85, 1.55); // fatter center segment
            const abd1 = new THREE.Mesh(abd1Geo, shellMat);
            abd1.position.set(-1.5, 0, 0.3);
            bodyGroup.add(abd1);

            // Abdomen Segment 2 (tapering rear segment)
            const abd2Geo = new THREE.SphereGeometry(2.6, 8, 6);
            abd2Geo.scale(1.3, 1.55, 1.25); // beefier rear section
            const abd2 = new THREE.Mesh(abd2Geo, shellMat);
            abd2.position.set(-4.5, 0, 0.1);
            bodyGroup.add(abd2);

            // Tapered Tail spike
            const tailGeo = new THREE.ConeGeometry(1.2, 3.5, 8);
            tailGeo.rotateZ(Math.PI / 2); // Point backward (-X)
            const tail = new THREE.Mesh(tailGeo, shellMat);
            tail.position.set(-6.8, 0, -0.2);
            bodyGroup.add(tail);

            // Organic underbelly tissue/muscle layer (rounded cylinder)
            const underbellyGeo = new THREE.CylinderGeometry(1.8, 1.5, 7.5, 8);
            underbellyGeo.rotateZ(Math.PI / 2); // align along X
            underbellyGeo.scale(1.0, 1.55, 1.15); // more swollen underbelly profile
            const underbelly = new THREE.Mesh(underbellyGeo, underbellyMat);
            underbelly.position.set(-1.5, 0, -0.8);
            bodyGroup.add(underbelly);

            // Head (curved snout/head and beak plates)
            const headBaseGeo = new THREE.CylinderGeometry(1.5, 1.8, 2.0, 8);
            headBaseGeo.rotateZ(Math.PI / 2);
            const headBase = new THREE.Mesh(headBaseGeo, underbellyMat);
            headBase.position.set(3.5, 0, 0.3);
            bodyGroup.add(headBase);

            const headSnoutGeo = new THREE.SphereGeometry(1.6, 8, 6);
            headSnoutGeo.scale(1.1, 1.3, 1.05);
            const headSnout = new THREE.Mesh(headSnoutGeo, shellMat);
            headSnout.position.set(5.0, 0, 0.1);
            bodyGroup.add(headSnout);

            // Sleek spaceship cockpit visor (replacing the organic bug eyes/mouth pincer face)
            const canopyGeo = new THREE.SphereGeometry(1.1, 24, 24);
            canopyGeo.scale(1.3, 1.25, 0.75); // wider and taller visor band to match head shape
            const canopy = new THREE.Mesh(canopyGeo, glowMat); // glowing orange horizontal visor band
            canopy.position.set(5.7, 0, 0.2);
            bodyGroup.add(canopy);

            // Armored brow/shield plating over visor
            const browGeo = new THREE.BoxGeometry(0.6, 2.8, 0.45); // widened to match visor
            const brow = new THREE.Mesh(browGeo, shellMat);
            brow.position.set(5.5, 0, 0.6);
            brow.rotation.y = 0.25; // slants forward/down
            bodyGroup.add(brow);

            // Lower chin visor shield
            const chinGeo = new THREE.BoxGeometry(0.5, 2.3, 0.45); // widened to match visor
            const chin = new THREE.Mesh(chinGeo, shellMat);
            chin.position.set(5.5, 0, -0.2);
            chin.rotation.y = -0.25; // slants forward/up
            bodyGroup.add(chin);

            // 3. Under-belly Heavy Bombard Mortar Cannon (Faceted Hard Shell Barrel)
            const cannonGroup = new THREE.Group();
            cannonGroup.position.set(-0.5, 0, -1.6); // lowered slightly for bloated underbelly
            bomberGroup.add(cannonGroup);
            bomberGroup.reactorCore = cannonGroup; // Keep reference to reactorCore name to prevent errors in other loops if any

            // Outer cannon housing (octagonal cylinder pointing down-forward)
            const barrelOuterGeo = new THREE.CylinderGeometry(2.0, 2.4, 4.2, 8);
            barrelOuterGeo.rotateX(Math.PI / 2); // align initially
            const barrelOuter = new THREE.Mesh(barrelOuterGeo, underbellyMat);
            // Angle it 36 degrees forward and down
            barrelOuter.rotation.y = Math.PI / 5;
            cannonGroup.add(barrelOuter);

            // Muzzle ring/lip (cast iron nozzle look)
            const muzzleGeo = new THREE.TorusGeometry(2.3, 0.42, 6, 8);
            muzzleGeo.rotateY(Math.PI / 2);
            const muzzle = new THREE.Mesh(muzzleGeo, nozzleMat);
            muzzle.position.set(0, 0, -2.1); // offset to end of barrel
            muzzle.rotation.y = Math.PI / 5;
            cannonGroup.add(muzzle);

            // Inside glowing plasma core (weapon charge)
            const barrelInnerGeo = new THREE.CylinderGeometry(1.4, 1.4, 3.5, 8);
            barrelInnerGeo.rotateX(Math.PI / 2);
            const barrelInner = new THREE.Mesh(barrelInnerGeo, glowMat);
            barrelInner.rotation.y = Math.PI / 5;
            cannonGroup.add(barrelInner);
            bomberGroup.cannonCore = barrelInner; // Reference for pulsing scale



            // 7. Quad Engine Nozzles & Volumetric Flame Cones
            const nozzleGeo = new THREE.CylinderGeometry(0.5, 0.8, 1.8, 8);
            nozzleGeo.rotateZ(Math.PI / 2); // align along X

            const fireGeo = new THREE.ConeGeometry(0.55, 4.0, 6);
            fireGeo.rotateZ(-Math.PI / 2); // Point backward along -X
            fireGeo.translate(-2.0, 0, 0); // Offset pivot to base

            const enginesData = [
                { y: 1.5,  z: 1.0,  scale: 0.85, xOffset: -7.5 },  // Upper Left
                { y: -1.5, z: 1.0,  scale: 0.85, xOffset: -7.5 },  // Upper Right
                { y: 1.1,  z: -0.6, scale: 0.8,  xOffset: -7.5 },  // Lower Left
                { y: -1.1, z: -0.6, scale: 0.8,  xOffset: -7.5 }   // Lower Right
            ];

            const flames = [];

            enginesData.forEach(eng => {
                const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
                nozzle.position.set(eng.xOffset, eng.y, eng.z);
                nozzle.scale.set(eng.scale, eng.scale, eng.scale);
                bomberGroup.add(nozzle);

                const ringGeo = new THREE.TorusGeometry(0.45 * eng.scale, 0.12 * eng.scale, 6, 8);
                ringGeo.rotateY(Math.PI / 2);
                const ring = new THREE.Mesh(ringGeo, glowMat);
                ring.position.set(eng.xOffset - 1.0, eng.y, eng.z);
                bomberGroup.add(ring);

                const coreFlame = new THREE.Mesh(fireGeo, coreFlameMat);
                coreFlame.position.set(eng.xOffset - 1.0, eng.y, eng.z);
                coreFlame.scale.set(0.3 * eng.scale, 0.3 * eng.scale, 0.5 * eng.scale);
                bomberGroup.add(coreFlame);

                const midFlame = new THREE.Mesh(fireGeo, midFlameMat);
                midFlame.position.set(eng.xOffset - 1.0, eng.y, eng.z);
                midFlame.scale.set(0.7 * eng.scale, 0.7 * eng.scale, 0.85 * eng.scale);
                bomberGroup.add(midFlame);

                const outerFlame = new THREE.Mesh(fireGeo, glowFlameMat);
                outerFlame.position.set(eng.xOffset - 1.0, eng.y, eng.z);
                outerFlame.scale.set(1.1 * eng.scale, 1.1 * eng.scale, 1.1 * eng.scale);
                bomberGroup.add(outerFlame);

                flames.push({
                    core: coreFlame,
                    mid: midFlame,
                    outer: outerFlame,
                    baseScaleX: 0.3 * eng.scale,
                    baseScaleYZ: 0.7 * eng.scale
                });
            });
            bomberGroup.flames = flames;

            // 8. Dynamic Animation Tick Hook
            bomberGroup.tick = (enemy, game) => {
                let time = 0;
                if (game && typeof game.time !== 'undefined') {
                    time = game.time * 0.05;
                } else {
                    time = Date.now() * 0.0015;
                }

                // Pulse the underbelly cannon housing scale
                if (bomberGroup.reactorCore) {
                    const pulse = 1.0 + Math.sin(time * 5.0) * 0.05;
                    bomberGroup.reactorCore.scale.set(pulse, pulse, pulse);
                }

                // Pulse the inner cannon weapon charge core along its length
                if (bomberGroup.cannonCore) {
                    const pulse = 1.0 + Math.sin(time * 8.0) * 0.12;
                    bomberGroup.cannonCore.scale.set(1.0, 1.0, pulse);
                }

                // Engine thruster flame flickering
                if (bomberGroup.flames) {
                    const flicker = 1.0 + (Math.random() - 0.5) * 0.15;
                    bomberGroup.flames.forEach(flame => {
                        flame.core.scale.set(flame.baseScaleX * flicker, flame.baseScaleX * (1.0 + Math.sin(time * 16.0) * 0.05), flame.baseScaleX * 1.4 * flicker);
                        flame.mid.scale.set(flame.baseScaleYZ * flicker, flame.baseScaleYZ * (1.0 + Math.cos(time * 14.0) * 0.04), flame.baseScaleYZ * 1.25 * flicker);
                        flame.outer.scale.set(flame.baseScaleYZ * 1.55 * flicker, flame.baseScaleYZ * 1.55 * (1.0 + Math.sin(time * 12.0) * 0.03), flame.baseScaleYZ * 1.55 * flicker);
                    });
                }
            };

            bomberGroup.scale.set(0.9, 0.9, 0.9); // scale slightly down to balance sizing in game

            group.add(bomberGroup);

        } else if (type === 'behemoth') {
            const behemothGroup = new THREE.Group();

            // Materials (Void Leviathan - Biomechanical Horror Theme)
            const hullMat = new THREE.MeshStandardMaterial({
                color: '#150c22', // Deep space-obsidian/indigo
                roughness: 0.75,
                metalness: 0.45,
                emissive: '#2b053d' // Menacing dark purple under-glow
            });

            const fleshMat = new THREE.MeshStandardMaterial({
                color: '#3b0764', // Dark purple/magenta organic flesh
                roughness: 0.6,
                metalness: 0.3
            });

            const boneMat = new THREE.MeshStandardMaterial({
                color: '#cbd5e1', // Ivory/bone teeth
                roughness: 0.8,
                metalness: 0.1
            });

            const glowMat = new THREE.MeshBasicMaterial({ color: '#d946ef' }); // Glowing violet/magenta

            const coreMat = new THREE.MeshBasicMaterial({
                color: '#bf00ff', // Violet core glow
                transparent: true,
                opacity: 0.55,
                blending: THREE.AdditiveBlending
            });
            
            // Volumetric purple/magenta engine flame layers
            const coreFlameMat = new THREE.MeshBasicMaterial({ color: '#ffffff' }); // White-hot core
            const midFlameMat = new THREE.MeshBasicMaterial({ color: '#d946ef', transparent: true, opacity: 0.85 }); // Magenta mid-flame
            const glowFlameMat = new THREE.MeshBasicMaterial({
                color: '#701a75', // Deep purple-magenta outer glow
                transparent: true,
                opacity: 0.45,
                blending: THREE.AdditiveBlending
            });

            // 1. Skeletal Ribcage (Tapered circular rings along the longitudinal X-axis)
            const ribsData = [
                { x: 12.0, radius: 4.5, tube: 0.8, scaleY: 1.25, scaleZ: 1.25, rotY: 0.15 },
                { x: 8.0,  radius: 6.5, tube: 1.0, scaleY: 1.45, scaleZ: 1.45, rotY: 0.1 },
                { x: 4.0,  radius: 8.0, tube: 1.1, scaleY: 1.55, scaleZ: 1.55, rotY: 0.05 },
                { x: 0.0,  radius: 8.5, tube: 1.2, scaleY: 1.6,  scaleZ: 1.6,  rotY: 0.0 },
                { x: -4.0, radius: 8.0, tube: 1.1, scaleY: 1.55, scaleZ: 1.55, rotY: -0.05 },
                { x: -8.0, radius: 7.0, tube: 1.0, scaleY: 1.45, scaleZ: 1.45, rotY: -0.1 },
                { x: -12.0, radius: 5.5, tube: 0.9, scaleY: 1.25, scaleZ: 1.25, rotY: -0.15 },
                { x: -16.0, radius: 4.0, tube: 0.7, scaleY: 1.0,  scaleZ: 1.0,  rotY: -0.2 }
            ];

            const ribs = [];
            ribsData.forEach(data => {
                const ribGeo = new THREE.TorusGeometry(data.radius, data.tube, 8, 24);
                ribGeo.rotateY(Math.PI / 2); // align perpendicular to X-axis
                const ribMesh = new THREE.Mesh(ribGeo, hullMat);
                ribMesh.position.set(data.x, 0, 0);
                ribMesh.scale.set(1.0, data.scaleY, data.scaleZ);
                ribMesh.rotation.y = data.rotY; // slight organic slant
                behemothGroup.add(ribMesh);
                ribs.push(ribMesh);
            });

            // 2. Spinal Column Spine & Spikes (connecting ribs along the top/bottom)
            const spineGeo = new THREE.CylinderGeometry(0.8, 0.8, 28, 8);
            spineGeo.rotateZ(Math.PI / 2); // align along X
            const topSpine = new THREE.Mesh(spineGeo, hullMat);
            topSpine.position.set(-2, 0, 9.5);
            behemothGroup.add(topSpine);

            const bottomSpine = new THREE.Mesh(spineGeo, hullMat);
            bottomSpine.position.set(-2, 0, -9.5);
            behemothGroup.add(bottomSpine);

            // Add spikes along top spine
            for (let xOffset = -14; xOffset <= 10; xOffset += 4) {
                const distFromCenter = Math.abs(xOffset + 2) / 12; // 0 to 1
                const spikeHeight = 3.5 * (1.0 - distFromCenter * 0.4) + 0.5;
                const spikeGeo = new THREE.ConeGeometry(0.7, spikeHeight, 4);
                spikeGeo.rotateX(Math.PI / 2); // point outward (+Z)
                spikeGeo.rotateZ(0.25 * (xOffset / 12)); // angle outward/backward
                
                const spike = new THREE.Mesh(spikeGeo, hullMat);
                spike.position.set(xOffset, 0, 10.0 + (1.0 - distFromCenter) * 1.5);
                behemothGroup.add(spike);
            }

            // 3. Jaws & Teeth (Menacing open mouth at the front)
            const upperJawBase = new THREE.Mesh(new THREE.BoxGeometry(6, 7.5, 6.5), hullMat);
            upperJawBase.position.set(14.5, 0, 3.5);
            behemothGroup.add(upperJawBase);

            const upperJawTipGeo = new THREE.ConeGeometry(3.5, 6.0, 4);
            upperJawTipGeo.rotateZ(-Math.PI / 2); // Point forward (+X)
            upperJawTipGeo.scale(1, 1.0, 1.1); // rounder aspect ratio
            const upperJawTip = new THREE.Mesh(upperJawTipGeo, hullMat);
            upperJawTip.position.set(18.5, 0, 2.0);
            behemothGroup.add(upperJawTip);

            const lowerJawBase = new THREE.Mesh(new THREE.BoxGeometry(6, 7.0, 5.5), hullMat);
            lowerJawBase.position.set(14.5, 0, -3.5);
            behemothGroup.add(lowerJawBase);

            const lowerJawTipGeo = new THREE.ConeGeometry(3.0, 6.0, 4);
            lowerJawTipGeo.rotateZ(-Math.PI / 2); // Point forward
            lowerJawTipGeo.scale(1, 0.9, 0.9); // rounder aspect ratio
            const lowerJawTip = new THREE.Mesh(lowerJawTipGeo, hullMat);
            lowerJawTip.position.set(18.5, 0, -2.0);
            behemothGroup.add(lowerJawTip);

            // Add teeth inside the jaws
            const toothGeo = new THREE.ConeGeometry(0.35, 1.8, 4);
            toothGeo.rotateX(Math.PI); // Point down

            const addTooth = (x, y, z, rotX, rotY, rotZ) => {
                const tooth = new THREE.Mesh(toothGeo, boneMat);
                tooth.position.set(x, y, z);
                tooth.rotation.set(rotX, rotY, rotZ);
                behemothGroup.add(tooth);
            };

            // Upper teeth (pointing down)
            for (let i = 0; i < 4; i++) {
                const x = 14.0 + i * 1.5;
                const widthY = 2.8 - (i * 0.4);
                const heightZ = 1.0 - (i * 0.1);
                addTooth(x, widthY, heightZ, 0.2, 0, 0.1); // Left upper
                addTooth(x, -widthY, heightZ, -0.2, 0, -0.1); // Right upper
            }

            // Lower teeth (pointing up)
            const lowerToothGeo = new THREE.ConeGeometry(0.3, 1.6, 4); // points up by default
            const addLowerTooth = (x, y, z, rotX, rotY, rotZ) => {
                const tooth = new THREE.Mesh(lowerToothGeo, boneMat);
                tooth.position.set(x, y, z);
                tooth.rotation.set(rotX, rotY, rotZ);
                behemothGroup.add(tooth);
            };

            for (let i = 0; i < 4; i++) {
                const x = 14.0 + i * 1.5;
                const widthY = 2.6 - (i * 0.4);
                const heightZ = -1.5 + (i * 0.1);
                addLowerTooth(x, widthY, heightZ, -0.2, 0, 0.1); // Left lower
                addLowerTooth(x, -widthY, heightZ, 0.2, 0, -0.1); // Right lower
            }

            // 4. Clustered Violet Eyes (Multiple glowing domes on the head)
            const eyesData = [
                // Left side
                { x: 17.5, y: 1.8,  z: 3.5, r: 0.55 },
                { x: 18.8, y: 1.3,  z: 3.0, r: 0.4 },
                { x: 16.5, y: 2.2,  z: 4.0, r: 0.35 },
                { x: 18.0, y: 2.2,  z: 2.8, r: 0.25 },
                // Right side
                { x: 17.5, y: -1.8, z: 3.5, r: 0.55 },
                { x: 18.8, y: -1.3, z: 3.0, r: 0.4 },
                { x: 16.5, y: -2.2, z: 4.0, r: 0.35 },
                { x: 18.0, y: -2.2, z: 2.8, r: 0.25 }
            ];

            const eyes = [];
            eyesData.forEach(data => {
                const eyeGeo = new THREE.SphereGeometry(data.r, 8, 8);
                const eyeMesh = new THREE.Mesh(eyeGeo, glowMat);
                eyeMesh.position.set(data.x, data.y, data.z);
                behemothGroup.add(eyeMesh);
                eyes.push(eyeMesh);
            });

            // 5. Front Mandibles/Pincers & Face Details
            const pincerGeo = new THREE.ConeGeometry(0.55, 3.5, 5);
            pincerGeo.rotateZ(-Math.PI / 2); // point forward
            pincerGeo.rotateY(0.4); // curve inward
            
            const leftPincer = new THREE.Mesh(pincerGeo, hullMat);
            leftPincer.position.set(13.0, 5.0, -1.0);
            leftPincer.rotation.z = 0.35;
            behemothGroup.add(leftPincer);

            const rightPincer = new THREE.Mesh(pincerGeo, hullMat);
            rightPincer.position.set(13.0, -5.0, -1.0);
            rightPincer.rotation.z = -0.35;
            behemothGroup.add(rightPincer);

            // Forehead Spiked Crest / Crown Horns
            const crestGeo = new THREE.ConeGeometry(0.8, 3.5, 4);
            crestGeo.rotateX(Math.PI / 2); // vertical fin orientation
            crestGeo.rotateZ(Math.PI / 6); // tilt backward
            const horn = new THREE.Mesh(crestGeo, hullMat);
            horn.position.set(16.5, 0, 5.8);
            behemothGroup.add(horn);

            const leftHornGeo = new THREE.ConeGeometry(0.5, 2.8, 4);
            leftHornGeo.rotateX(Math.PI / 2);
            leftHornGeo.rotateZ(Math.PI / 4); // tilt outward and backward
            const leftHorn = new THREE.Mesh(leftHornGeo, hullMat);
            leftHorn.position.set(15.0, 1.8, 5.4);
            behemothGroup.add(leftHorn);

            const rightHorn = new THREE.Mesh(leftHornGeo, hullMat);
            rightHorn.position.set(15.0, -1.8, 5.4);
            rightHorn.rotation.set(leftHorn.rotation.x, leftHorn.rotation.y, -leftHorn.rotation.z); // symmetric tilt
            behemothGroup.add(rightHorn);

            // Hooded Brow Plates (Angry brows slanting over the eyes)
            const browGeo = new THREE.BoxGeometry(3.5, 0.8, 0.8);
            
            const leftBrow = new THREE.Mesh(browGeo, hullMat);
            leftBrow.position.set(17.8, 1.9, 3.9);
            leftBrow.rotation.set(-0.1, 0.2, 0.15); // angle over left eye cluster
            behemothGroup.add(leftBrow);

            const rightBrow = new THREE.Mesh(browGeo, hullMat);
            rightBrow.position.set(17.8, -1.9, 3.9);
            rightBrow.rotation.set(0.1, -0.2, -0.15); // angle over right eye cluster
            behemothGroup.add(rightBrow);

            // Saber Fangs (Long curved front teeth protruding from upper jaw tip)
            const fangGeo = new THREE.ConeGeometry(0.4, 2.8, 4);
            fangGeo.rotateZ(Math.PI / 10); // tilt slightly back
            
            const leftFang = new THREE.Mesh(fangGeo, boneMat);
            leftFang.position.set(19.2, 1.3, 0.8);
            leftFang.rotation.set(0.25, 0, 0); // slant out
            behemothGroup.add(leftFang);

            const rightFang = new THREE.Mesh(fangGeo, boneMat);
            rightFang.position.set(19.2, -1.3, 0.8);
            rightFang.rotation.set(-0.25, 0, 0); // slant out
            behemothGroup.add(rightFang);

            // Throat Cannon (Glowing plasma weapon core inside the mouth cavity)
            const throatGeo = new THREE.SphereGeometry(1.6, 12, 12);
            const throatCannon = new THREE.Mesh(throatGeo, coreMat);
            throatCannon.position.set(13.2, 0, 0.0);
            behemothGroup.add(throatCannon);
            behemothGroup.throatCannon = throatCannon;

            // 6. Central Void Reactor Core (Visible inside the hollow ribcage)
            const coreGroup = new THREE.Group();
            coreGroup.position.set(0, 0, 0);

            const coreOrbGeo = new THREE.SphereGeometry(4.8, 16, 16);
            const coreOrb = new THREE.Mesh(coreOrbGeo, coreFlameMat); // White core center
            coreGroup.add(coreOrb);

            // Volumetric core glow shroud
            const coreGlowGeo = new THREE.SphereGeometry(5.8, 16, 16);
            const coreGlow = new THREE.Mesh(coreGlowGeo, coreMat);
            coreGroup.add(coreGlow);

            // Nested Swirling Vortex Rings
            const ring1Geo = new THREE.TorusGeometry(7.0, 0.4, 6, 24);
            const ring1 = new THREE.Mesh(ring1Geo, glowMat);
            ring1.rotation.set(Math.PI / 4, Math.PI / 6, 0);
            coreGroup.add(ring1);

            const ring2Geo = new THREE.TorusGeometry(6.4, 0.35, 6, 24);
            const ring2 = new THREE.Mesh(ring2Geo, coreMat);
            ring2.rotation.set(-Math.PI / 3, 0, Math.PI / 4);
            coreGroup.add(ring2);

            const ring3Geo = new THREE.TorusGeometry(5.8, 0.3, 6, 24);
            const ring3 = new THREE.Mesh(ring3Geo, glowMat);
            ring3.rotation.set(0, -Math.PI / 6, -Math.PI / 3);
            coreGroup.add(ring3);

            behemothGroup.add(coreGroup);

            // Expose core references for animation
            behemothGroup.coreOrb = coreOrb;
            behemothGroup.coreGlow = coreGlow;
            behemothGroup.vortexRing1 = ring1;
            behemothGroup.vortexRing2 = ring2;
            behemothGroup.vortexRing3 = ring3;

            // 7. Jointed Writhing Tentacles (Trailing from the rear)
            const tentacles = [];
            const tentacleBases = [
                { y: 3.5,  z: 3.5,  offset: 0 },
                { y: -3.5, z: 3.5,  offset: Math.PI / 2 },
                { y: 3.5,  z: -3.5, offset: Math.PI },
                { y: -3.5, z: -3.5, offset: Math.PI * 1.5 }
            ];

            const segmentGeo = new THREE.CylinderGeometry(0.5, 0.35, 4.5, 6);
            segmentGeo.rotateZ(Math.PI / 2); // align along X
            segmentGeo.translate(-2.25, 0, 0); // pivot at base

            const segment2Geo = new THREE.CylinderGeometry(0.35, 0.2, 4.0, 6);
            segment2Geo.rotateZ(Math.PI / 2);
            segment2Geo.translate(-2.0, 0, 0);

            const segment3Geo = new THREE.CylinderGeometry(0.2, 0.05, 3.5, 6);
            segment3Geo.rotateZ(Math.PI / 2);
            segment3Geo.translate(-1.75, 0, 0);

            tentacleBases.forEach((base, tIndex) => {
                const s1 = new THREE.Mesh(segmentGeo, hullMat);
                s1.position.set(-16.0, base.y, base.z);
                behemothGroup.add(s1);

                const s2 = new THREE.Mesh(segment2Geo, fleshMat);
                s2.position.set(-4.5, 0, 0); // relative to s1 end
                s1.add(s2);

                const s3 = new THREE.Mesh(segment3Geo, glowMat);
                s3.position.set(-4.0, 0, 0); // relative to s2 end
                s2.add(s3);

                tentacles.push({
                    s1: s1,
                    s2: s2,
                    s3: s3,
                    offset: base.offset
                });
            });
            behemothGroup.tentacles = tentacles;

            // 8. Biomechanical Exhaust Vents & Violet Flames
            const nozzleGeo = new THREE.CylinderGeometry(1.2, 0.6, 3.5, 8);
            nozzleGeo.rotateZ(Math.PI / 2); // align along X
            nozzleGeo.translate(-1.75, 0, 0); // pivot at base

            const fireGeo = new THREE.ConeGeometry(0.8, 5.0, 6);
            fireGeo.rotateZ(-Math.PI / 2); // point backward along -X
            fireGeo.translate(-2.5, 0, 0); // offset pivot

            const ventsData = [
                { y: 5.5,  z: 0.0,  rotY: 0.2,  rotZ: 0.3 },   // Left side
                { y: -5.5, z: 0.0,  rotY: -0.2, rotZ: -0.3 },  // Right side
                { y: 2.5,  z: -4.5, rotY: 0.1,  rotZ: 0.0 },   // Bottom left
                { y: -2.5, z: -4.5, rotY: -0.1, rotZ: 0.0 }    // Bottom right
            ];

            const flames = [];

            ventsData.forEach(vent => {
                const ventGroup = new THREE.Group();
                ventGroup.position.set(-14.0, vent.y, vent.z);
                ventGroup.rotation.set(0, vent.rotY, vent.rotZ);

                const nozzle = new THREE.Mesh(nozzleGeo, hullMat);
                ventGroup.add(nozzle);

                const lipGeo = new THREE.TorusGeometry(0.7, 0.15, 6, 8);
                lipGeo.rotateY(Math.PI / 2);
                const lip = new THREE.Mesh(lipGeo, glowMat);
                lip.position.set(-3.5, 0, 0);
                ventGroup.add(lip);

                const coreFlame = new THREE.Mesh(fireGeo, coreFlameMat);
                coreFlame.position.set(-3.5, 0, 0);
                coreFlame.scale.set(0.3, 0.3, 0.45);
                ventGroup.add(coreFlame);

                const midFlame = new THREE.Mesh(fireGeo, midFlameMat);
                midFlame.position.set(-3.5, 0, 0);
                midFlame.scale.set(0.7, 0.7, 0.8);
                ventGroup.add(midFlame);

                const outerFlame = new THREE.Mesh(fireGeo, glowFlameMat);
                outerFlame.position.set(-3.5, 0, 0);
                outerFlame.scale.set(1.1, 1.1, 1.1);
                ventGroup.add(outerFlame);

                behemothGroup.add(ventGroup);

                flames.push({
                    core: coreFlame,
                    mid: midFlame,
                    outer: outerFlame
                });
            });
            behemothGroup.flames = flames;

            // 9. Side Scythe Fins (Adding organic profile extension)
            const finGeo = new THREE.BoxGeometry(8.0, 1.2, 3.5);
            
            const leftFin = new THREE.Mesh(finGeo, hullMat);
            leftFin.position.set(2, 8.5, 2.0);
            leftFin.rotation.set(0.2, 0.1, 0.3);
            behemothGroup.add(leftFin);

            const rightFin = new THREE.Mesh(finGeo, hullMat);
            rightFin.position.set(2, -8.5, 2.0);
            rightFin.rotation.set(-0.2, -0.1, -0.3);
            behemothGroup.add(rightFin);

            // 10. Forward Warp Drive Field Emitter (Warp drill / shield for ramming)
            const warpGroup = new THREE.Group();
            warpGroup.position.set(19.0, 0, 0); // situated at the front tip of the jaws

            // Translucent warp cone (rushing displacement field)
            const warpConeGeo = new THREE.ConeGeometry(3.5, 6.0, 8, 1, true); // open-ended cone
            warpConeGeo.rotateZ(-Math.PI / 2); // point forward (+X)
            warpConeGeo.translate(3.0, 0, 0); // shift pivot to base
            
            const warpCone = new THREE.Mesh(warpConeGeo, new THREE.MeshBasicMaterial({
                color: '#c084fc', // Bright neon lavender/violet
                transparent: true,
                opacity: 0.3,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            }));
            warpGroup.add(warpCone);

            // Three concentric warp projector rings scaling down towards the front tip
            const warpRings = [];
            const warpRingsData = [
                { x: 1.0, radius: 3.2, tube: 0.2 },
                { x: 2.5, radius: 2.2, tube: 0.15 },
                { x: 4.0, radius: 1.2, tube: 0.1 }
            ];

            warpRingsData.forEach(data => {
                const ringGeo = new THREE.TorusGeometry(data.radius, data.tube, 6, 16);
                ringGeo.rotateY(Math.PI / 2); // perpendicular to X-axis
                const ring = new THREE.Mesh(ringGeo, glowMat);
                ring.position.set(data.x, 0, 0);
                warpGroup.add(ring);
                warpRings.push(ring);
            });

            behemothGroup.add(warpGroup);

            // Expose references for tick animation
            behemothGroup.warpCone = warpCone;
            behemothGroup.warpRings = warpRings;

            // 11. Dynamic Animation Tick Hook
            behemothGroup.tick = (enemy, game) => {
                let time = 0;
                if (game && typeof game.time !== 'undefined') {
                    time = game.time * 0.05;
                } else {
                    time = Date.now() * 0.0015;
                }

                // Swirl nested rings
                if (behemothGroup.vortexRing1) {
                    behemothGroup.vortexRing1.rotation.x += 0.012;
                    behemothGroup.vortexRing1.rotation.y += 0.008;
                }
                if (behemothGroup.vortexRing2) {
                    behemothGroup.vortexRing2.rotation.y -= 0.016;
                    behemothGroup.vortexRing2.rotation.z += 0.012;
                }
                if (behemothGroup.vortexRing3) {
                    behemothGroup.vortexRing3.rotation.z += 0.02;
                    behemothGroup.vortexRing3.rotation.x -= 0.008;
                }

                // Pulse core
                const pulseScale = 1.0 + Math.sin(time * 3.5) * 0.07;
                if (behemothGroup.coreOrb) {
                    behemothGroup.coreOrb.scale.set(pulseScale, pulseScale, pulseScale);
                }
                if (behemothGroup.coreGlow) {
                    const glowPulse = 1.0 + Math.cos(time * 3.5) * 0.05;
                    behemothGroup.coreGlow.scale.set(glowPulse, glowPulse, glowPulse);
                }
                if (behemothGroup.throatCannon) {
                    const throatPulse = 1.0 + Math.sin(time * 5.0) * 0.08;
                    behemothGroup.throatCannon.scale.set(throatPulse, throatPulse, throatPulse);
                }

                // Writhe jointed tentacles
                if (behemothGroup.tentacles) {
                    behemothGroup.tentacles.forEach(t => {
                        t.s1.rotation.y = Math.sin(time * 2.5 + t.offset) * 0.12;
                        t.s1.rotation.z = Math.cos(time * 2.0 + t.offset) * 0.07;

                        t.s2.rotation.y = Math.sin(time * 2.5 + t.offset + 0.8) * 0.15;
                        t.s3.rotation.y = Math.sin(time * 3.0 + t.offset + 1.6) * 0.2;
                    });
                }

                // Energy thruster flickering
                if (behemothGroup.flames) {
                    const flicker = 1.0 + (Math.random() - 0.5) * 0.12;
                    behemothGroup.flames.forEach(flame => {
                        flame.core.scale.set(0.3 * flicker, 0.3 * (1.0 + Math.sin(time * 15.0) * 0.04), 0.45 * flicker);
                        flame.mid.scale.set(0.7 * flicker, 0.7 * (1.0 + Math.cos(time * 12.0) * 0.03), 0.8 * flicker);
                        flame.outer.scale.set(1.1 * flicker, 1.1 * (1.0 + Math.sin(time * 10.0) * 0.02), 1.1 * flicker);
                    });
                }

                // Warp drive field animations
                if (behemothGroup.warpCone) {
                    behemothGroup.warpCone.rotation.x += 0.07; // spin the warp energy drill
                    const warpScaleX = 1.0 + Math.sin(time * 12.0) * 0.16; // fast oscillation
                    const warpScaleYZ = 1.0 + Math.cos(time * 10.0) * 0.08;
                    behemothGroup.warpCone.scale.set(warpScaleX, warpScaleYZ, warpScaleYZ);
                }
                if (behemothGroup.warpRings) {
                    behemothGroup.warpRings.forEach((ring, index) => {
                        // oscillate rings forward along X axis representing displacement waves
                        ring.position.x = (index === 0 ? 1.0 : index === 1 ? 2.5 : 4.0) + Math.sin(time * 8.0 - index * 1.5) * 0.22;
                        // pulse scale
                        const ringScale = 1.0 + Math.cos(time * 8.0 - index * 1.5) * 0.12;
                        ring.scale.set(1.0, ringScale, ringScale);
                    });
                }
            };

            // Scale up the entire Void Leviathan assembly to be slightly bigger
            behemothGroup.scale.set(1.18, 1.18, 1.18);

            group.add(behemothGroup);
        }

        return group;
    }

    // =========================================================================
    //  MODEL CATALOG (metadata for the viewer page)
    // =========================================================================

    const MODEL_CATALOG = {
        vanguard: {
            name: 'VANGUARD-7',
            subtitle: 'ALL-ROUNDER',
            category: 'ship',
            color: '#00f2ff',
            description: 'Balanced fighter with moderate hull, shields, and firepower. The standard-issue vessel for Void Drifter pilots.',
            create: createVanguardMesh,
            cameraDistance: 60,
        },
        wraith: {
            name: 'WRAITH',
            subtitle: 'GLASS CANNON',
            category: 'ship',
            color: '#b84dff',
            description: 'Lightning-fast interceptor with devastating firepower but paper-thin defenses. For ace pilots only.',
            create: createWraithMesh,
            cameraDistance: 60,
        },
        bastion: {
            name: 'BASTION',
            subtitle: 'HEAVY TANK',
            category: 'ship',
            color: '#ff6b00',
            description: 'Massive armored warship. Slow but nearly indestructible, with quad engines and reinforced hull plating.',
            create: createBastionMesh,
            cameraDistance: 70,
        },
        spectre: {
            name: 'SPECTRE',
            subtitle: 'SHIELD MASTER',
            category: 'ship',
            color: '#00ff88',
            description: 'Stealth diamond-hull design with advanced shield emitter dome. Regenerates shields faster than any other vessel.',
            create: createSpectreMesh,
            cameraDistance: 60,
        },
        station: {
            name: 'ORBITAL STATION',
            subtitle: 'CENTRAL DEFENSE HUB',
            category: 'station',
            color: '#00f2ff',
            description: 'The central orbital station at coordinates (0,0). Features a glowing reactor core, protective shell, torus ring, and four solar panel arrays.',
            create: createSpaceStationMesh,
            cameraDistance: 250,
        },
        swarmer: {
            name: 'VIPER SWARMER',
            subtitle: 'CRESCENT SCYTHE',
            category: 'enemy',
            color: '#ff0033',
            description: 'Sleek, crescent-shaped alien fighter drone with glowing crimson engine thrusters. Fast and agile, specializing in hit-and-run maneuvers.',
            create: () => createEnemyMesh('swarmer'),
            cameraDistance: 40,
        },
        bomber: {
            name: 'HIVE WEAVER',
            subtitle: 'ARMORED DRONE CARRIER',
            category: 'enemy',
            color: '#ff7700',
            description: 'Heavy bio-mechanical drone carrier. Features a faceted golden-amber hard-shell armor carapace, a heavy under-belly mortar cannon, and a sleek glowing horizontal visor.',
            create: () => createEnemyMesh('bomber'),
            cameraDistance: 65,
        },
        behemoth: {
            name: 'VOID LEVIATHAN',
            subtitle: 'BIOMECHANICAL HORROR',
            category: 'enemy',
            color: '#bf00ff',
            description: 'Terrifying biomechanical cosmic leviathan. Dominated by a swirling void core reactor, a segmented skeletal ribcage, gaping fanged jaws, and writhing tentacles.',
            create: () => createEnemyMesh('behemoth'),
            cameraDistance: 70,
        },
    };

    // =========================================================================
    //  PUBLIC API
    // =========================================================================

    return {
        createPlayerShipMesh,
        createVanguardMesh,
        createWraithMesh,
        createBastionMesh,
        createSpectreMesh,
        createSpaceStationMesh,
        createEnemyMesh,
        MODEL_CATALOG,
    };

})();
