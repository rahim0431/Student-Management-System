<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                "message" => "User not found"
            ]);
        }

        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                "message" => "Password incorrect"
            ]);
        }

        return response()->json([
            "message" => "Login successful",
            "role" => $user->role,
            "token" => $user->createToken('auth_token')->plainTextToken 
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'firstName' => 'required|string',
            'lastName' => 'required|string',
            'email' => 'required|email|unique:students',
            'phone' => 'required|string',
            'course' => 'required|string',
            'year' => 'required|string',
            'enrollmentDate' => 'required|date',
            'password' => 'required|min:6'
        ]);

        try {
            $user = Student::create([
                'first_name' => $request->firstName,
                'last_name' => $request->lastName,
                'email' => $request->email,
                'phone' => $request->phone,
                'course' => $request->course,
                'year' => $request->year,
                'enrollment_date' => $request->enrollmentDate,
                'password' => Hash::make($request->password)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                "message" => "Database Error: " . $e->getMessage()
            ], 500);
        }

        return response()->json([
            "message" => "User registered successfully",
            "user" => $user
        ], 201);
    }
}
