<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function dashboard()
    {
        $totalStudents = Student::count();
        $totalTeachers = Teacher::count();

        return response()->json([
            'stats' => [
                'total_students' => $totalStudents,
                'total_teachers' => $totalTeachers,
            ]
        ]);
    }

    public function addStudent(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'phone' => 'required|string',
            'course' => 'required|string',
            'year' => 'nullable|integer',
        ]);

        // 1. Create the User (Login details)
        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'student', // Force role to student
            'phone' => $request->phone,
            'course' => $request->course,
            'year' => (string) ($request->year ?? 'N/A'),
            'enrollment_date' => now()->toDateString(),
        ]);

        // 2. Create the Student details linked to the User
        $student = Student::create([
            'user_id' => $user->id,
            'phone' => $request->phone,
            'course' => $request->course,
            'year' => $request->year ?? 1,
            'enrollment_date' => now()->toDateString(),
        ]);

        return response()->json([
            'message' => 'Student created successfully',
            'student' => $student
        ], 201);
    }

    // View Students
    public function viewStudents()
    {
        // Fetch students with their user details (name, email)
        $students = Student::with('user')->get();
        return response()->json($students);
    }

    // Delete Student
    public function deleteStudent($id)
    {
        // Find the student record
        $student = Student::find($id);

        if (!$student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        // Delete the associated User (this will cascade delete the student if set up in DB, otherwise delete both)
        if ($student->user) {
            $student->user->delete();
        } else {
            $student->delete();
        }

        return response()->json(['message' => 'Student deleted successfully']);
    }

    //To Update Student
    
    public function updateStudent(Request $request, $id)
    {
        $student = Student::with('user')->find($id);

        if (!$student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        $user = $student->user;

        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
            'phone' => 'required|string',
            'course' => 'required|string',
            'year' => 'nullable|integer',
        ]);

        // Update User details
        $user->fill([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'phone' => $request->phone,
            'course' => $request->course,
            'year' => (string) ($request->year ?? 'N/A'),
        ]);

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }
        $user->save();

        // Update Student specific details
        $student->fill([
            'phone' => $request->phone,
            'course' => $request->course,
            'year' => $request->year ?? 1,
        ]);
        $student->save();

        return response()->json([
            'message' => 'Student updated successfully',
            'student' => $student->load('user'),
        ]);
    }

    public function addTeacher(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'phone' => 'nullable|string',
            'department' => 'required|string',
            'experience' => 'required|integer',
        ]);

        $user = User::create([
            'first_name'=>$request->first_name,
            'last_name'=>$request->last_name,
            'email'=>$request->email,
            'password'=>Hash::make($request->password),
            'role'=>'teacher',
            'phone' => $request->phone ?? 'N/A',
            'year' => 'N/A',
            'enrollment_date' => now()->toDateString(),
        ]);

        $teacher = Teacher::create([
            'user_id' => $user->id,
            'department' => $request->department,
            'experience' => $request->experience,
        ]);

        return response()->json([
            "message"=>"Teacher added successfully",
            "teacher" => $teacher
        ], 201);
    }

    // VIEW TEACHERS
    public function viewTeachers()
    {
        $teachers = Teacher::with('user')->get();
        return response()->json($teachers);
    }

    // DELETE TEACHER
    public function deleteTeacher($id)
    {
        $teacher = Teacher::find($id);

        if(!$teacher){
            return response()->json([
                "message"=>"Teacher not found"
            ],404);
        }

        if ($teacher->user) {
            $teacher->user->delete();
        } else {
            $teacher->delete();
        }

        return response()->json([
            "message"=>"Teacher deleted successfully"
        ]);
    }

    // To Update Teacher
    public function updateTeacher(Request $request, $id)
    {
        $teacher = Teacher::with('user')->find($id);

        if (!$teacher) {
            return response()->json(['message' => 'Teacher not found'], 404);
        }

        $user = $teacher->user;

        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
            'phone' => 'nullable|string',
            'department' => 'required|string',
            'experience' => 'required|integer',
        ]);

        // Update User details
        $user->fill([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'phone' => $request->phone ?? 'N/A',
        ]);

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }
        $user->save();

        // Update Teacher specific details
        $teacher->fill([
            'department' => $request->department,
            'experience' => $request->experience,
        ]);
        $teacher->save();

        return response()->json([
            'message' => 'Teacher updated successfully',
            'teacher' => $teacher->load('user'),
        ]);
    }
}
