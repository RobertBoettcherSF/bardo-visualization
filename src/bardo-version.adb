package body Bardo.Version is

   Stamp : constant String := "v0.11 b20261123-1734 96deed4";

   procedure Copy (Buffer : out String; Length : out Natural) is
   begin
      Buffer := [others => ' '];
      Length := Stamp'Length;
      Buffer (Buffer'First .. Buffer'First + Length - 1) := Stamp;
   end Copy;

end Bardo.Version;
