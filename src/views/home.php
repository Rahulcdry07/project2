<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to SecureReg</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        body {
            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%); /* Deeper, more vibrant gradient */
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            text-align: center;
            /* overflow: hidden; /* Prevent scrollbar from animations */
        }

        .home-container {
            background: rgba(255, 255, 255, 0.15); /* Slightly less transparent */
            backdrop-filter: blur(15px); /* More blur */
            border-radius: 25px; /* More rounded corners */
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2); /* Stronger shadow */
            padding: 3.5rem;
            width: 100%;
            max-width: 700px; /* Slightly wider */
            animation: fadeIn 1s ease-out;
            border: 1px solid rgba(255, 255, 255, 0.3); /* Subtle white border */
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(50px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.03); }
            100% { transform: scale(1); }
        }

        .home-container h1 {
            font-size: 3.5rem; /* Larger heading */
            margin-bottom: 1.5rem;
            font-weight: 800; /* Bolder */
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3); /* Text shadow */
            animation: pulse 2s infinite ease-in-out; /* Subtle pulse animation */
        }

        .home-container p {
            font-size: 1.3rem; /* Larger paragraph */
            margin-bottom: 2.5rem;
            line-height: 1.8;
            opacity: 0.9;
        }

        .btn-group a {
            display: inline-block;
            padding: 18px 35px; /* Larger buttons */
            margin: 0 15px;
            border-radius: 30px; /* Pill-shaped buttons */
            text-decoration: none;
            font-size: 1.2rem;
            font-weight: 700;
            transition: all 0.4s ease; /* Slower transition */
            box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2); /* Button shadow */
        }

        .btn-primary {
            background: #fff;
            color: #6a11cb; /* Match new gradient start color */
        }

        .btn-primary:hover {
            background: #f0f0f0;
            transform: translateY(-5px) scale(1.02); /* More pronounced hover */
            box-shadow: 0 15px 25px rgba(0, 0, 0, 0.3);
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.25); /* More opaque */
            color: #fff;
            border: 2px solid #fff;
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.4); /* More opaque on hover */
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 15px 25px rgba(0, 0, 0, 0.3);
        }

        .features {
            margin-top: 4rem; /* More space */
            display: flex;
            justify-content: center; /* Center features */
            flex-wrap: wrap;
        }

        .feature-item {
            flex-basis: 28%; /* Slightly smaller for more spacing */
            margin: 20px;
            padding: 25px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            text-align: center;
            transition: transform 0.4s ease, box-shadow 0.4s ease;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15); /* Feature item shadow */
            border: 1px solid rgba(255, 255, 255, 0.2); /* Subtle white border */
        }

        .feature-item:hover {
            transform: translateY(-10px) scale(1.03); /* More pronounced hover */
            box-shadow: 0 18px 30px rgba(0, 0, 0, 0.25);
        }

        .feature-item i {
            font-size: 3rem; /* Larger icons */
            margin-bottom: 20px;
            color: #fff;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
        }

        .feature-item h3 {
            font-size: 1.6rem; /* Larger heading */
            margin-bottom: 12px;
            font-weight: 700;
        }

        .feature-item p {
            font-size: 1rem;
            margin-bottom: 0;
            opacity: 0.8;
        }

        @media (max-width: 768px) {
            .home-container {
                padding: 2.5rem;
                max-width: 90%;
            }
            .home-container h1 {
                font-size: 2.8rem;
            }
            .home-container p {
                font-size: 1.1rem;
            }
            .btn-group a {
                display: block;
                margin: 15px 0;
                padding: 15px 25px;
            }
            .features {
                margin-top: 3rem;
            }
            .feature-item {
                flex-basis: 90%;
                margin: 15px 0;
            }
        }
    </style>
</head>
<body>
    <div class="home-container">
        <h1>Welcome to SecureReg!</h1>
        <p>Your secure and easy way to manage registrations. Join our community today!</p>
        <div class="btn-group">
            <a href="login.html" class="btn-primary">Sign In</a>
            <a href="register.html" class="btn-secondary">Register Now</a>
        </div>

        <div class="features">
            <div class="feature-item">
                <i class="fas fa-user-shield"></i>
                <h3>Secure Accounts</h3>
                <p>Your data is protected with industry-leading encryption.</p>
            </div>
            <div class="feature-item">
                <i class="fas fa-tachometer-alt"></i>
                <h3>Fast & Reliable</h3>
                <p>Experience lightning-fast registration and login.</p>
            </div>
            <div class="feature-item">
                <i class="fas fa-mobile-alt"></i>
                <h3>Responsive Design</h3>
                <p>Access your account seamlessly on any device.</p>
            </div
        </div>
    </div>
</body>
</html>