async function main() {
  const response = await fetch('http://localhost:5000/api/auth/unified-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'admin@society.com',
      password: 'adminpassword123'
    })
  });

  console.log('Status:', response.status);
  console.log('Headers:', Object.fromEntries(response.headers.entries()));
  const text = await response.text();
  console.log('Body:', text);
}

main().catch(console.error);
