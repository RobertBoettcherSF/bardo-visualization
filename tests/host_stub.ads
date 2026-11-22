with System;

--  Native stand-in for the JS import the wasm host provides.
package Host_Stub is
   procedure Trap (File : System.Address; Line : Integer) with
     Export, Convention => C, External_Name => "bardo_host_trap";
   function Ready return Boolean;
end Host_Stub;
