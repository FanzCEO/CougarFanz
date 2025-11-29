module.exports = {
  apps: [{
    name: "cougarfanz",
    script: "dist/index.js",
    cwd: "/var/www/cougarfanz",
    env: {
      NODE_ENV: "production",
      PORT: 3002,
      PLATFORM_NAME: "CougarFanz",
      SESSION_SECRET: "166e64581407d0c851aa53c364a4c8d4749420c6859bb5d915bfe851be8dd423",
      JWT_SECRET: "cougarfanz_jwt_secret_key_2024_secure",
      DATABASE_URL: "postgresql://postgres:Dg1FcM4jk5XkKE3B@db.mcayxybcgxhfttvwmhgm.supabase.co:5432/postgres",
      REPLIT_DOMAINS: "cougar.fanz.website",
      GOOGLE_CLIENT_ID: "placeholder",
      GOOGLE_CLIENT_SECRET: "placeholder",
      NODE_TLS_REJECT_UNAUTHORIZED: "0"
    }
  }]
};
