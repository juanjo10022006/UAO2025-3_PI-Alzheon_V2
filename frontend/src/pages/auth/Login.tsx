// src/pages/Login.tsx
import { useState } from "react";
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch } from '../../store/store';
import { startLogin } from '../../store/thunks/authThunk';

export const Login = () => {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await dispatch(startLogin({ email: correo, password: contrasena }));
      if (result) {
        navigate('/');
      }
    } catch (error) {
      console.error('Error en login:', error);
    }
  };

  const backgroundImage = "/background.jpg";

  return (
    <div className="min-h-screen relative bg-[#13172b]">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <img 
          src={backgroundImage} 
          alt="Mountain landscape" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Login Container */}
      <div className="relative flex items-center justify-center min-h-screen">
        <div className="w-[450px] h-[480px] relative">
          {/* Glassmorphism Background */}
          <div className="absolute inset-0 rounded-[34px]">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl rounded-[34px] border border-white/20"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-white/5 rounded-[34px]"></div>
          </div>
          
          {/* Content */}
          <div className="relative flex flex-col items-center pt-[40px] px-[60px] pb-[40px] h-full">
            {/* Title */}
            <h1 className="text-[36px] font-extrabold text-black text-center mb-[16px] leading-none">
              Login
            </h1>
            
            {/* Line separator */}
            <div className="w-[320px] h-[1px] bg-black/20 mb-[16px]"></div>
            
            <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-[320px]">
              {/* Email Input */}
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="Correo"
                  className="w-full h-[56px] rounded-[20px] bg-black/20 px-[20px] text-white/48 text-[18px] font-medium placeholder-white/48 border-none outline-none"
                  required
                />
              </div>
              
              {/* Password Input */}
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full h-[56px] rounded-[20px] bg-black/20 px-[20px] text-white/48 text-[18px] font-medium placeholder-white/48 border-none outline-none"
                  required
                />
              </div>
              
              {/* Line separator */}
              <div className="w-full h-[1px] bg-black/20 mb-[16px]"></div>
              
              {/* Login Button */}
              <button
                type="submit"
                className="w-full h-[56px] rounded-[20px] bg-black/74 text-white text-[20px] font-bold hover:bg-black/80 transition-colors"
              >
                Ingresar
              </button>
            </form>
            
            {/* Register Link */}
            <p className="text-center text-[16px] font-semibold text-black/42 mt-6">
              Regístrate aquí
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};