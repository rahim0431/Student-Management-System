<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\RequestDemo;

class RequestDemoController extends Controller
{
    public function index()
    {
        $requests = RequestDemo::orderBy('created_at', 'desc')->get();
        return response()->json($requests);
    }

    public function destroy($id)
    {
        $requestDemo = RequestDemo::find($id);
        if (!$requestDemo) {
            return response()->json(['message' => 'Demo request not found'], 404);
        }

        $requestDemo->delete();
        return response()->json(['message' => 'Demo request deleted successfully']);
    }

    public function store (Request $request)
    {
        RequestDemo::create([
        'full_name' => $request->full_name,
        'email' => $request->email,
        'phone' => $request->phone,
        'institution_name' => $request->institution_name,
        'institution_type' => $request->institution_type,
        'campus_size' => $request->campus_size,
        'primary_goal' => $request->primary_goal,
        'message' => $request->message
    ]);
    
    return response()->json([
        'message' => 'Demo Request Submitted Successfully'
    ]);
    }
    
}
