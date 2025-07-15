import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// 🔐 Deine Supabase-Daten:
const supabaseUrl = 'https://uedocrmntzzxescgmpkw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlZG9jcm1udHp6eGVzY2dtcGt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NTc0NTUsImV4cCI6MjA2MzEzMzQ1NX0.6C6OmnYBouLHTtlOAVoq4JQM-5o9j9YvIadYoKP5DC0'
const supabase = createClient(supabaseUrl, supabaseKey)

const form = document.getElementById('login-form')
const errorMsg = document.getElementById('error-msg')

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  errorMsg.textContent = ''

  const email = document.getElementById('email').value
  const password = document.getElementById('password').value

  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    errorMsg.textContent = 'Login fehlgeschlagen: ' + error.message
  } else {
    const userId = authData.user.id

    // UID in der admin-Tabelle überprüfen
    const { data: adminEntry, error: adminError } = await supabase
      .from('admin')
      .select('*')
      .eq('id', userId)
      .single()

    if (adminError) {
      // Kein Eintrag gefunden → normaler Admin
      window.location.href = '/admin/index.html'
    } else {
      // UID ist in der admin-Tabelle → Superadmin
      window.location.href = '/superadmin/index.html'
    }
  }
})
