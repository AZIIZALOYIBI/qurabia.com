/**
 * ============================================================
 * InteractiveBlochSphere.tsx - كرة بلوخ التفاعلية
 * QURABIA
 * 
 * يطبق تصور بصري ثلاثي الأبعاد لحالة الكيوبت باستخدام Three.js
 * ============================================================
 */

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface BlochSphereProps {
  theta: number; // زاوية التدوير θ (polar angle)
  phi: number;   // زاوية التدوير φ (azimuthal angle)
  size?: number;
}

const InteractiveBlochSphere: React.FC<BlochSphereProps> = ({ 
  theta, 
  phi, 
  size = 300 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef    = useRef<THREE.Scene | null>(null);
  const cameraRef   = useRef<THREE.PerspectiveCamera | null>(null);
  const vectorRef   = useRef<THREE.ArrowHelper | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- إعداد المشهد ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(2, 2, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- إعداد الكرة ---
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.15 
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);

    // --- إعداد المحاور ---
    const axesHelper = new THREE.AxesHelper(1.5);
    scene.add(axesHelper);

    // --- إعداد متجه الحالة |ψ⟩ ---
    const origin = new THREE.Vector3(0, 0, 0);
    const dir    = new THREE.Vector3(0, 1, 0); // الحالة الافتراضية |0⟩
    const arrowHelper = new THREE.ArrowHelper(dir, origin, 1.2, 0xff00ff);
    scene.add(arrowHelper);
    vectorRef.current = arrowHelper;

    // --- إضاءة خفيفة ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // --- حلقة التحريك ---
    const animate = () => {
      requestAnimationFrame(animate);
      if (sceneRef.current && cameraRef.current) {
        renderer.render(scene, camera);
      }
    };
    animate();

    return () => {
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [size]);

  // --- تحديث المتجه بناءً على θ و φ ---
  useEffect(() => {
    if (vectorRef.current) {
      // التحويل من إحداثيات كروية إلى كارتيزية
      // x = sin(θ) * cos(φ)
      // z = sin(θ) * sin(φ)
      // y = cos(θ) (باعتبار y هو المحور الرأسي |0⟩)
      const x = Math.sin(theta) * Math.cos(phi);
      const z = Math.sin(theta) * Math.sin(phi);
      const y = Math.cos(theta);
      
      const newDir = new THREE.Vector3(x, y, z).normalize();
      vectorRef.current.setDirection(newDir);
    }
  }, [theta, phi]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: size, 
        height: size, 
        background: 'rgba(0,0,0,0.2)', 
        borderRadius: '50%',
        boxShadow: '0 0 20px rgba(0,255,255,0.1)'
      }} 
    />
  );
};

export default InteractiveBlochSphere;
