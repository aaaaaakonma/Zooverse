'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Three.js scene component with SSR disabled
const ThreeScene = dynamic(() => import('@/components/ThreeScene'), {
  ssr: false,
  loading: () => (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      color: 'var(--text-secondary)',
      gap: '12px'
    }}>
      <div className="statusIndicator pulse" style={{ width: '12px', height: '12px' }}></div>
      <span style={{ fontSize: '0.85rem', letterSpacing: '0.05em' }}>MEMULAI MESIN GRAFIS...</span>
    </div>
  ),
});

const ANIMAL_DATA = {
  giraffe: {
    name: 'Jerapah',
    scientificName: 'Giraffa camelopardalis',
    status: 'Rentan',
    statusColor: '245, 158, 11',
    description: 'Hewan darat tertinggi yang masih hidup dan ruminansia terbesar. Jerapah mudah dikenali dari leher dan kakinya yang sangat panjang, serta pola mantelnya yang khas.',
    stats: {
      'Tinggi': 'Hingga 5,7 m',
      'Kecepatan': '60 km/jam',
      'Makanan': 'Herbivora',
      'Berat': '1.200 kg'
    },
    funFacts: [
      "Jerapah hanya butuh tidur 5 hingga 30 menit per 24 jam, sering kali dilakukan dalam bentuk tidur siang singkat.",
      "Jantung jerapah memiliki berat sekitar 11 kg (25 lb) and memompa darah dengan tekanan dua kali lipat tekanan darah normal agar bisa mencapai otak mereka.",
      "Sama seperti sidik jari manusia, tidak ada dua jerapah yang memiliki pola bintik yang persis sama."
    ]
  },
  antelope: {
    name: 'Antelop',
    scientificName: 'Antilocapra americana',
    status: 'Risiko Rendah',
    statusColor: '16, 185, 129',
    description: 'Hewan pemakan rumput yang anggun dan lincah yang berasal dari sabana dan padang rumput. Terkenal dengan kecepatan ekstrim dan ketahanan mereka untuk menghindari predator.',
    stats: {
      'Tinggi': '0,9 m',
      'Kecepatan': '88 km/jam',
      'Makanan': 'Herbivora',
      'Berat': '60 kg'
    },
    funFacts: [
      "Antelop memiliki mata yang lebar yang memungkinkan mereka melihat hampir 360 derajat, membantu mereka mendeteksi predator.",
      "Mereka dapat melakukan lompatan vertikal hingga 3 meter (10 kaki) untuk mengejutkan dan mengelabui predator.",
      "Tanduk mereka terbuat dari tulang yang dilapisi keratin (seperti kuku manusia) dan tidak pernah berhenti tumbuh."
    ]
  },
  cheetah: {
    name: 'Cheetah',
    scientificName: 'Acinonyx jubatus',
    status: 'Rentan',
    statusColor: '245, 158, 11',
    description: 'Mamalia darat tercepat di Bumi, dirancang untuk akselerasi kecepatan yang singkat dan eksplosif. Ditandai dengan tubuhnya yang langsing, dada yang dalam, mantel berbintik, dan garis air mata.',
    stats: {
      'Tinggi': '0,8 m',
      'Kecepatan': '120 km/jam',
      'Makanan': 'Karnivora',
      'Berat': '54 kg'
    },
    funFacts: [
      "Cheetah dapat melaju dari 0 hingga 97 km/jam (60 mph) hanya dalam waktu 3 detik, lebih cepat daripada kebanyakan mobil sport.",
      "Berbeda dengan kucing besar lainnya, cheetah tidak bisa mengaum; sebaliknya, mereka mendengkur seperti kucing rumahan saat merasa senang.",
      "Garis hitam 'air mata' mereka membentang dari mata ke mulut, menyerap silau dari terik matahari."
    ]
  }
};

export default function Home() {
  const shape = 'zoo_terrain';
  const color = '#ffd085';
  const customMaterial = false;
  const [selectedAnimal, setSelectedAnimal] = useState<'giraffe' | 'antelope' | 'cheetah' | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);



  const ANIMALS: Array<'giraffe' | 'antelope' | 'cheetah'> = ['giraffe', 'antelope', 'cheetah'];

  const handleNext = () => {
    if (!selectedAnimal) return;
    const currentIndex = ANIMALS.indexOf(selectedAnimal);
    const nextIndex = (currentIndex + 1) % ANIMALS.length;
    setSelectedAnimal(ANIMALS[nextIndex]);
  };

  const handlePrev = () => {
    if (!selectedAnimal) return;
    const currentIndex = ANIMALS.indexOf(selectedAnimal);
    const prevIndex = (currentIndex - 1 + ANIMALS.length) % ANIMALS.length;
    setSelectedAnimal(ANIMALS[prevIndex]);
  };

  return (
    <div className="appContainer">
      {/* Lapisan Canvas 3D WebGL */}
      <main className="canvasContainer" aria-label="Pemandangan 3D WebGL">
        <ThreeScene 
          shape={shape} 
          color={color} 
          customMaterial={customMaterial}
          selectedAnimal={selectedAnimal}
          onSelectAnimal={setSelectedAnimal}
          onLoaded={() => setIsLoaded(true)}
        />
      </main>

      {/* Splash / Login Overlay */}
      {showSplash && (
        <div className={`splashContainer ${hasStarted ? 'fadeOut' : ''}`}>
          <div className="splashContent">
            <img src="/Logo.png" alt="Zoo Logo" className="splashLogo" />
            
            {!isLoaded ? (
              <div className="splashLoadingContainer">
                <div className="splashProgressBarContainer">
                  <div className="splashProgressBar"></div>
                </div>
                <span className="splashLoadingText">Memuat Suaka Margasatwa...</span>
              </div>
            ) : (
              <button 
                className="startBtn"
                onClick={() => {
                  setHasStarted(true);
                  setTimeout(() => setShowSplash(false), 800);
                }}
              >
                Mulai Pengalaman
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating UI HUD Overlay */}
      <div 
        className="uiOverlay"
        style={{ 
          opacity: hasStarted ? 1 : 0, 
          transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s, visibility 0.6s step-end 0.2s',
          visibility: hasStarted ? 'visible' : 'hidden'
        } as React.CSSProperties}
      >
        {/* Top Floating Dynamic Island */}
        <div className={`dynamicIsland ${selectedAnimal ? 'profileMode' : 'exploreMode'}`}>
          {!selectedAnimal ? (
            <div className="islandContent explore">
              <span className="islandLabel">Pilih Cepat:</span>
              <button className="islandBtn" onClick={() => setSelectedAnimal('giraffe')}>
                Jerapah
              </button>
              <span className="islandDivider">|</span>
              <button className="islandBtn" onClick={() => setSelectedAnimal('antelope')}>
                Antelop
              </button>
              <span className="islandDivider">|</span>
              <button className="islandBtn" onClick={() => setSelectedAnimal('cheetah')}>
                Cheetah
              </button>
            </div>
          ) : (
            <div className="islandContent profile">
              <button className="islandNavBtn" onClick={handlePrev} aria-label="Hewan sebelumnya">
                ◀
              </button>
              <div className="islandActiveAnimal">
                {selectedAnimal === 'giraffe' && 'Jerapah'}
                {selectedAnimal === 'antelope' && 'Antelop'}
                {selectedAnimal === 'cheetah' && 'Cheetah'}
              </div>
              <button className="islandNavBtn" onClick={handleNext} aria-label="Hewan berikutnya">
                ▶
              </button>
              <span className="islandDivider">|</span>
              <button className="islandHomeBtn" onClick={() => setSelectedAnimal(null)} aria-label="Kembali ke Peta">
                Peta
              </button>
            </div>
          )}
        </div>

        {selectedAnimal && (
          <div className="glassPanel infoCard animateSlideIn" id="animal-info-card">
            <button className="closeBtn" onClick={() => setSelectedAnimal(null)} aria-label="Tutup profil">
              ✕
            </button>
            <span className="scientificName">{ANIMAL_DATA[selectedAnimal].scientificName}</span>
            <h2 className="animalName">{ANIMAL_DATA[selectedAnimal].name}</h2>
            <div className="statusBadge" style={{ '--badge-color': ANIMAL_DATA[selectedAnimal].statusColor } as React.CSSProperties}>
              {ANIMAL_DATA[selectedAnimal].status}
            </div>
            
            <p className="description">{ANIMAL_DATA[selectedAnimal].description}</p>
            
            <div className="statsGrid">
              {Object.entries(ANIMAL_DATA[selectedAnimal].stats).map(([key, value]) => (
                <div key={key} className="statBox">
                  <span className="statLabel">{key}</span>
                  <span className="statValue">{value}</span>
                </div>
              ))}
            </div>



            <div className="funFactsSection">
              <h4 className="funFactsTitle">Fakta Menarik</h4>
              <ul className="funFactsList">
                {ANIMAL_DATA[selectedAnimal].funFacts.map((fact, index) => (
                  <li key={index} className="funFactItem">{fact}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Navigasi & Tips Kontrol Kamera */}
        <div className="glassPanel cameraControls" id="navigation-tips">
          <span>Klik Kiri + Seret: <strong>Putar Kamera</strong></span>
          <span>Klik Kanan + Seret: <strong>Geser</strong></span>
          <span>Gulir: <strong>Perbesar/Perkecil</strong></span>
        </div>
      </div>
    </div>
  );
}
