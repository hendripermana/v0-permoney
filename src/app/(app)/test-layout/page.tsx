"use client"

export default function TestLayoutPage() {
  return (
    <div className="bg-red-500 p-4">
      <h1 className="text-white text-2xl font-bold">TEST LAYOUT - NO CONTAINER</h1>
      <div className="bg-blue-500 text-white p-4 mt-4">
        <p>This div should be full width minus padding</p>
        <p>If you see whitespace on the right, the problem is in app layout or sidebar</p>
      </div>
      
      <div className="bg-green-500 text-white p-4 mt-4">
        <div className="bg-yellow-500 text-black p-4">
          <p>Nested div - should also be full width</p>
        </div>
      </div>
      
      <div className="bg-purple-500 text-white p-4 mt-4 w-full">
        <p>With w-full class explicitly</p>
      </div>
      
      <div className="bg-orange-500 text-white p-4 mt-4 max-w-none">
        <p>With max-w-none class explicitly</p>
      </div>
      
      <div className="mx-auto w-full max-w-none bg-pink-500 text-white p-4 mt-4">
        <p>With mx-auto w-full max-w-none (like PageContainer)</p>
      </div>
    </div>
  )
}
